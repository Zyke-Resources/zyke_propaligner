---@class AlignmentData
---@field dict string
---@field clip string
---@field props PropAlignmentData[]
---@field restrictedFields? table<string, boolean | string | {disabled: boolean?, tooltip: string?, maxCount: number?}>

---@class ParticleAlignmentData
---@field dict string
---@field clip string
---@field offset Vector3Table
---@field size number
---@field handle? integer

---@class PropAlignmentData
---@field prop string
---@field bone integer
---@field offset Vector3Table
---@field rotation Vector3Table
---@field particles ParticleAlignmentData[] | nil
---@field entity? Prop @Entity id when spawned
---@field tempId? integer @UI stuff for keys

---@class EditingPropData : PropAlignmentData
---@field entity? integer

---@class PresetData : AlignmentData
---@field created OsTime

---@class HistoryData : PresetData
---@class ExportData : AlignmentData

---@class Preset
---@field id string
---@field label string
---@field data PresetData

-- Most same as preset, but:
-- Does not carry an id since that will be created
-- Does not save a created timestamp, as that will be created
---@class Export
---@field label string
---@field data ExportData

---@alias OsTime integer
---@alias Vector3Table table{x: number, y: number, z: number}
---@alias Quaternion table{x: number, y: number, z: number, w: number}
---@alias Vector3Array [number, number, number]
---@alias PlayerId integer
---@alias Success boolean
---@alias FailReason string
---@alias JSON string
---@alias Prop integer