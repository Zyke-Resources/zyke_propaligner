Config = Config or {}

Config.Settings = {
    language = "en",
    maxHistory = 100, -- Note that this is only history, not for presets, you will have to manage those yourselves to avoid incorrect removals
    presetsPerPage = 15, -- Probably don't touch
    openCommand = {"palign", "propalign", "alignprop"},
    permissions = {
        useMenu = "command",
        createPreset = "command",
        overwritePreset = "command",
        deletePreset = "command",
        importPreset = "command",
    },
    alignmentPosition = {
        {
            label = "Current Position",
            name = "current",
            getPosition = function()
                return GetEntityCoords(PlayerPedId()) - vector3(0, 0, 0.985)
            end
        },
        {
            label = "Sky",
            name = "sky",
            getPosition = function()
                return vector3(0, 0, 1000)
            end
        }
    }
}