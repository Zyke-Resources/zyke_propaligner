MountedUI = false

RegisterNUICallback("Eventhandler", function(passed, cb)
    local event <const> = passed.event
    local data <const> = passed.data

    if (event == "RetrieveLoadedStatus") then
        cb(HasLoaderFinished)
    elseif (event == "CloseMenu") then
        CloseMenu()

        cb("ok")
    elseif (event == "MountedUI") then
        MountedUI = true

        return cb("ok")
    elseif (event == "MenuUnmounted") then
        -- Runs when the menu is unmounted
        -- Filter when not truly "closed", to avoid accidental trigger when entering alignment mode
        if (Alignment.active) then return cb("ok") end

        -- Same data as AlignmentData
        TriggerEvent("zyke_propaligner:StoppedEditing", data)
        return cb("ok")
    elseif (event == "GetConfig") then
        return cb({
            Settings = {
                maxHistory = Config.Settings.maxHistory,
                presetsPerPage = Config.Settings.presetsPerPage,
                alignmentPosition = Config.Settings.alignmentPosition
            }
        })
    elseif (event == "GetStrings") then
        return cb(Translations)
    elseif (event == "Notify") then
        local isStr = type(data) == "string"
        local notifyStr <const> = isStr and data or data.string
        local formatting = not isStr and data.formatting or nil

        Z.notify(notifyStr, formatting)
        return cb("ok")
    elseif (event == "StartEditing") then
        Wait(100)

        -- Validate & load prop models
        for i = 1, #data.editingData.props do
            if (not Z.loadModel(data.editingData.props[i].prop, true)) then
                Z.notify("invalidModel")
                return cb("ok")
            end
        end

        -- Validate animation dict & clip
        if (data.editingData.dict ~= "" and data.editingData.clip ~= "") then
            local validAnims = IsAnimValid(data.editingData.dict, data.editingData.clip)
            if (not validAnims.dict) then Z.notify("invalidDict") return cb("ok") end
            if (not validAnims.clip) then Z.notify("invalidClip") return cb("ok") end
        end

        SetNuiFocus(false, false)
        SendNUIMessage({event = "SetSuspension", data = true})

        CreateThread(function()
            local _, alignmentIdx = Z.table.find(Config.Settings.alignmentPosition, function(pos) return pos.name == data.alignmentPosition end)

            Alignment:Enter(data.editingData, alignmentIdx)
        end)

        return cb("ok")
    elseif (event == "GetHistory") then
        local history = GetHistory()

        return cb(history)
    elseif (event == "GetPresets") then
        local presets, reason = Z.callback.await("zyke_propaligner:GetPresets", data)
        if (reason) then Z.notify(reason) end

        return cb(presets)
    elseif (event == "CreatePreset") then
        local presetData, reason = Z.callback.await("zyke_propaligner:CreatePreset", data)
        if (reason) then Z.notify(reason) end

        return cb(presetData)
    elseif (event == "OverwritePreset") then
        local presetData, reason = Z.callback.await("zyke_propaligner:OverwritePreset", data)
        if (reason) then Z.notify(reason) end

        return cb(presetData)
    elseif (event == "DeletePreset") then
        local success, reason = Z.callback.await("zyke_propaligner:DeletePreset", data)
        if (reason) then Z.notify(reason) end

        return cb(success)
    elseif (event == "ExportPresetJson") then
        ---@type Export
        local preset = {
            label = data.label,
            data = data.data
        }

        Z.copy(json.encode(preset))
        Z.notify("presetExportedJson")
    elseif (event == "ImportPreset") then
        local preset, reason = Z.callback.await("zyke_propaligner:ImportPreset", data)
        if (reason) then Z.notify(reason) end

        return cb(preset)
    elseif (event == "OnPresetLoad") then
        TriggerServerEvent("zyke_propaligner:OnPresetLoad", data)
    elseif (event == "ValidatePropModel") then
        return cb(Z.loadModel(data, true, 1000))
    elseif (event == "IsAnimValid") then
        return cb(IsAnimValid(data.dict, data.clip))
    elseif (event == "GetBones") then
        return cb(Config.Bones)
    elseif (event == "AlignmentMenuMounted") then
        AlignmentMenuMounted = true
        return cb("ok")
    elseif (event == "GetBaseAnimations") then
        local animations = load(LoadResourceFile("zyke_propaligner", "shared/animations.lua"))()

        return cb(animations)
    end

    cb("ok")
end)

-- After creating a preset, we will be waiting for this event to be sent
---@param data Preset
RegisterNetEvent("zyke_propaligner:PresetAdded", function(data)
    SendNUIMessage({
        event = "PresetAdded",
        data = data
    })
end)