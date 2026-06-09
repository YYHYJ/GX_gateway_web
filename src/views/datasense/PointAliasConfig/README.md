# 点位别名管理

## 功能说明

点位别名管理页面用于管理设备点位的别名配置，支持以下功能：

### 1. 查看别名列表

- 按设备筛选点位别名
- 搜索点位代码、名称、别名
- 分页显示

### 2. 批量生成别名

- 选择设备后，可批量为该设备的所有点位生成别名
- 别名格式：`device_code.point_code`（例如：`TEMP_001.temperature`）

### 3. 编辑别名

- 点击"编辑"按钮，可直接在表格中修改别名
- 按 Enter 保存，按 Esc 取消

### 4. 启用/禁用

- 可切换点位别名的启用/禁用状态
- 禁用的别名不会在上报时使用

### 5. 删除别名

- 删除不再需要的别名配置

## 数据表结构

```sql
CREATE TABLE IF NOT EXISTS point_alias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    device_code TEXT NOT NULL,
    device_name TEXT NOT NULL,
    point_id INTEGER NOT NULL,
    point_code TEXT NOT NULL,
    point_name TEXT NOT NULL,
    point_type TEXT NOT NULL,
    alias TEXT NOT NULL,
    scene TEXT NOT NULL DEFAULT 'default',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, point_type, point_id, scene),
    FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
);
```

## API 接口

- `GET /api/point_alias/list` - 获取别名列表
- `POST /api/point_alias/batch_generate` - 批量生成别名
- `PUT /api/point_alias/update` - 更新别名
- `PUT /api/point_alias/toggle_active` - 切换启用状态
- `DELETE /api/point_alias/delete` - 删除别名

## 使用场景

1. **MQTT 上报**：在 JSON 模板中使用别名作为点位的 key
2. **数据展示**：使用更易读的别名代替技术性的点位代码
3. **多语言支持**：可以为不同场景配置不同的别名

## 菜单位置

数据采集 > 点位别名

与"设备实例"同级，位于"数据采集"菜单下。
