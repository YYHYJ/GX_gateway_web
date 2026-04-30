# MQTT JSON 自定义模板方案

## 一、架构关系

```
方案(scheme) ──→ 点位列表(report_points)    ← 决定上报哪些点位
     │
     └──→ JSON模板(report_template)         ← 决定数据怎么组织成JSON
     
Topic ──→ 绑定方案 ──→ 按模板格式 + 方案点位 发布MQTT消息
```

- Topic 未绑定方案 → 全量发布（向后兼容）
- Topic 绑定了方案但方案无模板 → 按方案点位列表过滤，用默认格式发布
- Topic 绑定了方案且方案有模板 → 按模板渲染JSON发布

---

## 二、存储

新增表 `mqtt_report_templates`（在 `mqtt_conf.db` 中）：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| scheme_id | INTEGER NOT NULL UNIQUE | 关联 mqtt_schemes.id，一个方案一个模板 |
| template_json | TEXT NOT NULL | 前端保存的模板JSON字符串 |
| updated_at | DATETIME | 更新时间 |

外键：`FOREIGN KEY (scheme_id) REFERENCES mqtt_schemes(id) ON DELETE CASCADE`

**API：**
- `GET /api/mqtt/report_template?scheme_id=1` → 返回 template_json
- `PUT /api/mqtt/report_template` → 请求体 `{ "scheme_id": 1, "template": {...} }`，用 INSERT OR REPLACE 实现

---

## 三、模板数据结构

模板是一棵JSON树，根节点固定是 `object` 类型。

### 3.1 节点类型

| type | 说明 | 有 children | 有 source |
|------|------|:-----------:|:---------:|
| `object` | JSON对象 `{}` | ✅ | ❌ |
| `array` | JSON数组 `[]` | ✅ | ❌ |
| `leaf` | 叶子节点，产出最终的值 | ❌ | ✅ |

### 3.2 节点完整字段

```json
{
  "key": "字段名，如 timestamp、params 等",
  "type": "object | array | leaf",

  "source": "point | fixed | system",   // 仅 leaf 有效
  "value": "",                           // fixed 的值 或 system 的变量名
  "point_id": "",                        // source=point 时关联 mqtt_report_points.id

  "auto_fill": false,                    // 仅 object/array 有效，是否自动填充方案点位
  "fill_mode": "flat_kv",               // 自动填充模式
  "key_field": "point_code",            // key来源：point_code 或 report_alias
  "children": []                         // 子节点数组
}
```

> **说明：** `auto_fill`、`fill_mode`、`key_field` 仅在 `type` 为 `object` 或 `array` 时有意义。`source`、`value`、`point_id` 仅在 `type` 为 `leaf` 时有意义。后端解析时可忽略不相关的字段。

---

## 四、叶子节点（leaf）的三种值来源

### 4.1 fixed — 固定值

```json
{ "key": "SN", "type": "leaf", "source": "fixed", "value": "gx11111" }
```

**后端处理：** 直接输出 `value`，自动识别类型：
- 纯数字字符串 `"123"` → 输出数字 `123`
- `"true"` / `"false"` → 输出布尔值
- 其他 → 输出字符串

> **示例：** `"value": "gx11111"` → 输出 `"gx11111"`，`"value": "100"` → 输出 `100`

### 4.2 system — 系统变量

```json
{ "key": "TS", "type": "leaf", "source": "system", "value": "timestamp" }
```

**后端处理：** 根据 `value` 中的变量名，填入运行时的系统值。

> **系统变量列表见第六节，需前后端共同确认。**

### 4.3 point — 点位数据

```json
{ "key": "temperature", "type": "leaf", "source": "point", "point_id": 5 }
```

**后端处理：**
1. 通过 `point_id` 查 `mqtt_report_points` 表 → 拿到 `device_id` + `point_code`
2. 从采集数据缓存中取该点位的实时值
3. 输出数值

> **示例：** 假设 point_id=5 对应 TEMP_001，当前采集值 25.6 → 输出 `25.6`

---

## 五、自动填充（auto_fill）

### 5.1 为什么需要

一个方案可能有几十甚至几百个点位，用户不可能在模板中逐个添加。自动填充让用户只需定义JSON的"骨架"，标记某个节点为"自动填充"，后端运行时自动把方案内所有点位按指定模式填入。

### 5.2 对象节点的填充模式

对象节点（`type: "object"`）仅支持一种模式：

| fill_mode | key_field=point_code 时的输出 | key_field=report_alias 时的输出 |
|-----------|------|------|
| `flat_kv` | `{"TEMP_001": 25.6, "PRESS_001": 101.3}` | `{"温度": 25.6, "压力": 101.3}` |

> **说明：** `key_field` 为 `report_alias` 时，如果某个点位没有设置别名，降级使用 `point_code`。

### 5.3 数组节点的填充模式

数组节点（`type: "array"`）支持四种模式：

| fill_mode | 输出示例 |
|-----------|---------|
| `array_simple` | `[25.6, 101.3, 1]` |
| `array_kv` | `[{"TEMP_001": 25.6}, {"PRESS_001": 101.3}]` |
| `array_id_value` | `[{"id": "TEMP_001", "value": 25.6}, {"id": "PRESS_001", "value": 101.3}]` |
| `array_full` | `[{"point_code": "TEMP_001", "name": "温度", "device": "果下PCS", "value": 25.6}, ...]` |

> **说明：** `array_kv` 模式的 key 同样受 `key_field` 控制。`array_full` 模式中 `name` 取 `report_alias`（无别名取 `point_code`），`device` 取设备名称。

### 5.4 手动子节点与自动填充的合并

`children` 中手动添加的节点**保留在前面**，自动填充的内容**追加在后面**。

示例模板：
```json
{
  "key": "params", "type": "object",
  "auto_fill": true, "fill_mode": "flat_kv", "key_field": "point_code",
  "children": [
    { "key": "version", "type": "leaf", "source": "fixed", "value": "1.0" }
  ]
}
```

运行时输出：
```json
"params": {
  "version": "1.0",
  "TEMP_001": 25.6,
  "PRESS_001": 101.3
}
```

> `version` 是手动添加的，后面的点位是自动填充的。

---

## 六、系统变量（⚠️ 需前后端确认）

以下是前端目前内置的系统变量，**需要后端确认哪些能在发布时提供**：

| 变量名 | 期望类型 | 说明 | 后端能否提供 |
|--------|---------|------|:----------:|
| `timestamp` | number | 当前时间戳（毫秒） | ？ |
| `timestamp_s` | number | 当前时间戳（秒） | ？ |
| `datetime` | string | 格式化时间 `"2025-01-15 10:30:00"` | ？ |
| `device_id` | number | 设备实例ID | ？ |
| `device_code` | string | 设备编码，如 `"gxpcs_TCP"` | ？ |
| `device_name` | string | 设备名称，如 `"果下PCS_TCP"` | ？ |
| `topic_name` | string | 当前发布的topic名称 | ？ |
| `broker_name` | string | 当前broker连接名称 | ？ |
| `scheme_name` | string | 当前方案名称 | ？ |
| `point_count` | number | 方案内点位总数 | ？ |

**需要讨论的问题：**

1. **timestamp 精度：** 毫秒还是秒？是否两种都支持？
2. **device 相关变量：** 一个方案可能包含多个设备的点位，`device_id`/`device_code`/`device_name` 填哪个设备的？建议：如果方案只关联一个设备则填该设备，多设备时不填或填空。
3. **最小集建议：** 先实现 `timestamp`、`datetime`、`topic_name` 这三个最确定的，其他按需扩展。
4. **确认后前后端同步硬编码：** 前端更新下拉选项，后端在渲染函数中硬编码取值逻辑。

---

## 七、完整示例

### 示例1：简单平铺

用户操作：根节点添加 TS（系统变量）+ params 对象（自动填充 flat_kv）

保存的模板：
```json
{
  "type": "object",
  "children": [
    { "key": "TS", "type": "leaf", "source": "system", "value": "timestamp" },
    {
      "key": "params", "type": "object",
      "auto_fill": true, "fill_mode": "flat_kv", "key_field": "point_code",
      "children": []
    }
  ]
}
```

运行时输出（假设方案有3个点位）：
```json
{
  "TS": 1752044247649,
  "params": {
    "TEMP_001": 25.6,
    "PRESS_001": 101.3,
    "STATUS_001": 1
  }
}
```

### 示例2：数组格式

保存的模板：
```json
{
  "type": "object",
  "children": [
    { "key": "TS", "type": "leaf", "source": "system", "value": "timestamp" },
    { "key": "SN", "type": "leaf", "source": "fixed", "value": "GX-001" },
    {
      "key": "data", "type": "array",
      "auto_fill": true, "fill_mode": "array_kv", "key_field": "point_code",
      "children": []
    }
  ]
}
```

运行时输出：
```json
{
  "TS": 1752044247649,
  "SN": "GX-001",
  "data": [
    { "TEMP_001": 25.6 },
    { "PRESS_001": 101.3 },
    { "STATUS_001": 1 }
  ]
}
```

### 示例3：多层嵌套

保存的模板：
```json
{
  "type": "object",
  "children": [
    { "key": "SN", "type": "leaf", "source": "fixed", "value": "GX-001" },
    { "key": "TS", "type": "leaf", "source": "system", "value": "timestamp" },
    {
      "key": "payload", "type": "object",
      "auto_fill": false,
      "children": [
        { "key": "version", "type": "leaf", "source": "fixed", "value": "2.0" },
        {
          "key": "values", "type": "object",
          "auto_fill": true, "fill_mode": "flat_kv", "key_field": "report_alias",
          "children": []
        },
        {
          "key": "list", "type": "array",
          "auto_fill": true, "fill_mode": "array_id_value",
          "children": []
        }
      ]
    }
  ]
}
```

运行时输出（假设点位 TEMP_001 别名"温度"，PRESS_001 别名"压力"）：
```json
{
  "SN": "GX-001",
  "TS": 1752044247649,
  "payload": {
    "version": "2.0",
    "values": {
      "温度": 25.6,
      "压力": 101.3
    },
    "list": [
      { "id": "TEMP_001", "value": 25.6 },
      { "id": "PRESS_001", "value": 101.3 }
    ]
  }
}
```

---

## 八、后端渲染伪代码

```
function render(node, context):
    if node.type == "object":
        result = {}
        // 1. 先处理手动子节点
        for child in node.children:
            result[child.key] = render(child, context)
        // 2. 自动填充
        if node.auto_fill:
            for point in context.scheme_points:
                key = point.report_alias if (node.key_field=="report_alias" and point.report_alias) else point.point_code
                result[key] = get_point_value(point.device_id, point.point_code)
        return result

    if node.type == "array":
        result = []
        // 1. 先处理手动子节点
        for child in node.children:
            result.append(render(child, context))
        // 2. 自动填充
        if node.auto_fill:
            for point in context.scheme_points:
                key = point.report_alias if (...) else point.point_code
                val = get_point_value(point.device_id, point.point_code)
                if node.fill_mode == "array_simple":
                    result.append(val)
                elif node.fill_mode == "array_kv":
                    result.append({key: val})
                elif node.fill_mode == "array_id_value":
                    result.append({"id": key, "value": val})
                elif node.fill_mode == "array_full":
                    result.append({"point_code": point.point_code, "name": key, "device": get_device_name(point.device_id), "value": val})
        return result

    if node.type == "leaf":
        if node.source == "fixed":
            return auto_parse(node.value)  // 自动识别数字/布尔/字符串
        if node.source == "system":
            return context.system_vars[node.value]
        if node.source == "point":
            point = find_report_point(node.point_id)
            return get_point_value(point.device_id, point.point_code)
        return null
```

---

## 九、实现优先级建议

1. **第一步：** 前后端确认系统变量列表 → 双方硬编码
2. **第二步：** 后端实现 `mqtt_report_templates` 表 + GET/PUT API → 前端联调保存/加载
3. **第三步：** 后端实现渲染函数 → 完整功能上线
