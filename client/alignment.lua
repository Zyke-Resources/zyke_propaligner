---@class ButtonProps
---@field label string
---@field getLabel? fun(): string
---@field key string | string[]
---@field activate? string @Key to enable this option
---@field disable? string @Key to disable this option
---@field forceRender? boolean @If pressed, forcefully re-register the buttons
---@field func fun(keyCode: integer, key: string, active: string?, disable: string?)

Alignment = {
    active = nil,
    orgPos = nil,
}

Alignment.__index = Alignment

RegisterNUICallback("Eventhandler:moveEntity", function(data, cb)
	if (not Alignment.active) then return end

	Alignment.active:HandleMoveEntity(data.data, cb)
end)

AddEventHandler("onResourceStop", function(resourceName)
	if (resourceName ~= GetCurrentResourceName()) then return end
	if (not Alignment.active) then return end

	Alignment.active:Reset()
	SetNuiFocus(false, false)
	SendNUIMessage({event = "setGizmoEntity", data = {handle = nil}})
end)

-- Disable looking around with mouse
function Alignment:RestrictCameraPan()
    DisableControlAction(0, 1, true) -- LookLeftRight
    DisableControlAction(0, 2, true) -- LookUpDown
end

function Alignment:RestrictMovement()
    local ply = PlayerPedId()

    DisableControlAction(0, 25, true) -- Input Aim
    DisableControlAction(0, 106, true) -- Vehicle Mouse Control Override
    DisableControlAction(0, 142, true) -- MeleeAttackAlternate
    DisablePlayerFiring(ply, true) -- Disable weapon firing
    DisableControlAction(0, 24, true) -- Attack
    DisableControlAction(0, 257, true) -- Attack 2
    DisableControlAction(0, 263, true) -- Melee Attack 1
    DisableControlAction(0, 264, true) -- Melee Attack 2
    DisableControlAction(0, 140, true) -- Melee Attack Alternate
    DisableControlAction(0, 141, true) -- Melee Attack Alternate 2
    DisableControlAction(0, 143, true) -- Melee Block
    DisableControlAction(0, 47, true) -- Disable weapon
    DisableControlAction(0, 58, true) -- Disable weapon

    DisableControlAction(0, 99, true) -- Disable scrolling in vehicle
    DisableControlAction(0, 100, true) -- Disable scrolling in vehicle
    DisableControlAction(0, 14, true) -- Disable scrolling in vehicle
    DisableControlAction(0, 16, true) -- Disable scrolling in vehicle
    DisableControlAction(0, 81, true) -- Disable scrolling in vehicle
    DisableControlAction(0, 82, true) -- Disable scrolling in vehicle

    DisableControlAction(0, 199, true) -- Pausing (P)
    DisableControlAction(0, 200, true) -- Pausing (ESC)

    DisableControlAction(0, 24, true)
    DisableControlAction(0, 69, true)
    DisableControlAction(0, 70, true)
    DisableControlAction(0, 92, true)
    DisableControlAction(0, 114, true)
    DisableControlAction(0, 140, true)
    DisableControlAction(0, 141, true)
    DisableControlAction(0, 142, true)
    DisableControlAction(0, 257, true)
    DisableControlAction(0, 263, true)
    DisableControlAction(0, 264, true)
    DisableControlAction(0, 331, true)
end

function Alignment:Reset()
    for i = 1, #self.props do
        if (self.props[i]?.entity and DoesEntityExist(self.props[i].entity)) then
            DeleteEntity(self.props[i].entity)
        end
    end

    if (Alignment.orgPos) then
        SetEntityCoords(PlayerPedId(), Alignment.orgPos.x, Alignment.orgPos.y, Alignment.orgPos.z - 0.985, false, false, false, false)
        FreezeEntityPosition(PlayerPedId(), false)
    end

    Alignment.active = nil
    Alignment.orgPos = nil

    ClearPedTasks(PlayerPedId())
end

function Alignment:EnsureProps()
    local ply = PlayerPedId()
    local plyPos = GetEntityCoords(ply)

    for i = 1, #self.props do
        if (not self.props[i]?.entity or not DoesEntityExist(self.props[i].entity)) then
            self.props[i].entity = CreateObject(self.props[i].prop, plyPos.x, plyPos.y, plyPos.z, false, false, false)
        end

        local boneIdx = GetPedBoneIndex(PlayerPedId(), self.props[i].bone)

        local offset = self.props[i].offset
        local rotation = self.props[i].rotation
        AttachEntityToEntity(self.props[i].entity, ply, boneIdx, offset.x, offset.y, offset.z, rotation.x, rotation.y, rotation.z, true, true, false, true, 1, true)
    end
end

function Alignment:SetGizmoEntity()
    if (self.currMode == "prop") then
        SendNUIMessage({
            event = "setGizmoEntity",
            data = {
                handle = self.props[self.propIdx].entity,
                position = vector3(
                    self.props[self.propIdx].offset.z + self.pos.x,
                    self.props[self.propIdx].offset.y + self.pos.y,
                    -self.props[self.propIdx].offset.x + self.propRaise
                ),
                rotation = vector3(
                    -self.props[self.propIdx].rotation.x,
                    self.props[self.propIdx].rotation.z,
                    self.props[self.propIdx].rotation.y
                ),
                currMode = self.currMode,
            }
        })
    elseif (self.currMode == "particle") then
        SendNUIMessage({
            event = "setGizmoEntity",
            data = {
                handle = self.props[self.propIdx].particles[self.particleIdx].handle,
                position = vector3(
                    self.props[self.propIdx].particles[self.particleIdx].offset.z + self.pos.x,
                    self.props[self.propIdx].particles[self.particleIdx].offset.y + self.pos.y,
                    -self.props[self.propIdx].particles[self.particleIdx].offset.x + self.propRaise
                ),
                rotation = vector3(0.0, 0.0, 0.0), -- Unused
                currMode = self.currMode,
            }
        })
    end
end

function Alignment:ClearHighlight()
    self.propHighlight = false

    if (self.currMode == "prop") then
        for i = 1, #self.props do
            if (self.props[i].entity and DoesEntityExist(self.props[i].entity)) then
                SetEntityDrawOutline(self.props[i].entity, false)
            end
        end
    end
end

function Alignment:HighlightCurrent()
    self.propHighlight = true

    if (self.currMode == "prop") then
        local prop = self.props[self.propIdx]
        if (prop and prop.entity and DoesEntityExist(prop.entity)) then
            SetEntityDrawOutline(prop.entity, true)
            SetEntityDrawOutlineColor(255, 255, 255, 255)
        end
    end
end

---@param data {position: Vector3Table, rotation: Vector3Table}
---@param cb fun(result: any)
function Alignment:HandleMoveEntity(data, cb)
    if (not self.props[self.propIdx]?.entity or not DoesEntityExist(self.props[self.propIdx].entity)) then return end

    if (self.currMode == "prop") then
        -- Some conversions to get the correct values
        self.props[self.propIdx].offset = vector3(self.propRaise - data.position.z, data.position.y - self.pos.y, data.position.x - self.pos.x)
        self.props[self.propIdx].rotation = vector3(data.rotation.x, data.rotation.y, data.rotation.z)

        local boneIdx = GetPedBoneIndex(PlayerPedId(), self.props[self.propIdx].bone)

        AttachEntityToEntity(
            self.props[self.propIdx].entity,
            PlayerPedId(),
            boneIdx,
            self.props[self.propIdx].offset.x,
            self.props[self.propIdx].offset.y,
            self.props[self.propIdx].offset.z,
            self.props[self.propIdx].rotation.x,
            self.props[self.propIdx].rotation.y,
            self.props[self.propIdx].rotation.z,
            true, true, false, true, 1, true
        )
    elseif (self.currMode == "particle") then
        -- Some conversions to get the correct values
        self.props[self.propIdx].particles[self.particleIdx].offset = vector3(self.propRaise - data.position.z, data.position.y - self.pos.y, data.position.x - self.pos.x)

        SetParticleFxLoopedOffsets(
            self.props[self.propIdx].particles[self.particleIdx].handle,
            self.props[self.propIdx].particles[self.particleIdx].offset.x,
            self.props[self.propIdx].particles[self.particleIdx].offset.y,
            self.props[self.propIdx].particles[self.particleIdx].offset.z,
            0.0, 0.0, 0.0
        )
    end

    cb("ok")
end

function Alignment:EnsureAnim(skipCheck)
    if (not self.anim.loopingAnimation) then return end
    if (self.anim.dict == "" or self.anim.clip == "") then return end

    local ply = PlayerPedId()

    -- Some delay to allow it to fully stop playing animation before running it again
    if (not skipCheck) then
        if (not IsPlayingAnim(self.anim.dict, self.anim.clip) and self.anim.stoppedAnim == 0) then self.anim.stoppedAnim = GetGameTimer() end
        if (self.anim.stoppedAnim ~= 0 and (GetGameTimer() - self.anim.stoppedAnim < self.anim.startAnimDelay)) then return end
    end

    if (not IsPlayingAnim(self.anim.dict, self.anim.clip)) then
        self.anim.stoppedAnim = 0

        local isAnimInf = IsAnimInfinite(self.anim.dict, self.anim.clip)
        local animDur = isAnimInf and -1 or math.floor((GetAnimDuration(self.anim.dict, self.anim.clip) * (1.0 / (self.anim.animSpeedIdx * self.anim.speedMultiplier)) * 1000))

        TaskPlayAnim(ply, self.anim.dict, self.anim.clip, 1.0, 1.0, animDur, 49, 0.0, false, false, false)

        -- Wait for the animation to start playing
        while (not IsPlayingAnim(self.anim.dict, self.anim.clip)) do Wait(1) end

        SetEntityAnimSpeed(ply, self.anim.dict, self.anim.clip, self.anim.animSpeedIdx * self.anim.speedMultiplier)
    end
end

-- Loop the props and then the particles, we check if there is a handle in the particles table and validate that
-- If there is no handle or it is invalid, we start the particle effect
function Alignment:EnsureParticles()
    for i = 1, #self.props do
        if (self.props[i].particles and DoesEntityExist(self.props[i].entity)) then
            for j = 1, #self.props[i].particles do
                local particleData = self.props[i].particles[j]

                if (not particleData.handle or not DoesParticleFxLoopedExist(particleData.handle)) then
                    UseParticleFxAssetNextCall(particleData.dict)

                    particleData.handle = StartParticleFxLoopedOnEntity(
                        particleData.clip,
                        self.props[i].entity,
                        particleData.offset.x,
                        particleData.offset.y,
                        particleData.offset.z,
                        0.0,
                        0.0,
                        0.0,
                        particleData.size + 0.0,
                        false,
                        false,
                        false
                    )
                end
            end
        end
    end
end

function Alignment:HighlightParticleOrigins()
    for i = 1, #self.props do
        if (self.props[i].particles and DoesEntityExist(self.props[i].entity)) then
            for j = 1, #self.props[i].particles do
                local particle = self.props[i].particles[j]
                local pos = GetOffsetFromEntityInWorldCoords(self.props[i].entity, particle.offset.x, particle.offset.y, particle.offset.z)

                DrawMarker(28, pos.x, pos.y, pos.z, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0075, 0.0075, 0.0075, 255, 0, 0, 255, false, true, 2, true, nil, nil, false)

                if (self.currMode == "particle" and self.propHighlight and self.particleIdx == j) then
                    DrawMarker(28, pos.x, pos.y, pos.z, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.03, 0.03, 0.03, 255, 255, 255, 100, false, true, 2, true, nil, nil, false)
                end
            end
        end
    end
end

---@param data AlignmentData
---@param positionIdx? integer @Alignment position index, or nil to use 1
---@return {offset: Vector3Table, rotation: Vector3Table}[] | nil, FailReason?
function Alignment:Enter(data, positionIdx)
    self = setmetatable({}, Alignment)

    -- First, validate the data input
    for i = 1, #data.props do
        if (not Z.loadModel(data.props[i].prop)) then
            return nil, "invalidModel"
        end

        if (data.props[i].particles) then
            for j = 1, #data.props[i].particles do
                self.hasParticles = true
                RequestNamedPtfxAsset(data.props[i].particles[j].dict)

                local started = GetGameTimer()

                while (not HasNamedPtfxAssetLoaded(data.props[i].particles[j].dict)) do
                    if (GetGameTimer() - started > 2000) then
                        return nil, "invalidParticleDict"
                    end

                    Wait(25)
                end
            end
        end
    end

    if (data.dict ~= "" and data.clip ~= "") then
        local validAnims = IsAnimValid(data.dict, data.clip)
        if (not validAnims.dict) then return nil, "invalidDict" end
        if (not validAnims.clip) then return nil, "invalidClip" end
    end

    positionIdx = positionIdx or 1
    local position = Config.Settings.alignmentPosition[positionIdx] or Config.Settings.alignmentPosition[1]

    self.pos = position.getPosition()
    self.propRaise = self.pos.z + 2.0

    Alignment.orgPos = GetEntityCoords(PlayerPedId())
    Alignment.active = self

    self.scaleform = Z.instructionalButtons.create()

	---@class Buttons
	---@field items ButtonProps[]
	---@field ensureLabels fun(self: Buttons): nil

	---@type Buttons
    self.buttons = {
        items = {},
        ensureLabels = function()
            for i = 1, #self.buttons.items do
                if (self.buttons.items[i].getLabel) then
                    self.buttons.items[i].label = self.buttons.items[i].getLabel()
                end
            end

            self.scaleform:registerButtons(self.buttons.items)
        end,
    }

	---@type PropAlignmentData[]
    self.props = {}

	---@type integer
    self.propIdx = 1

    ---@type integer
    self.particleIdx = self.hasParticles and 1 or 0

	---@type boolean
    self.propHighlight = false

    for i = 1, #data.props do
        ---@diagnostic disable-next-line: assign-type-mismatch
        self.props[i] = data.props[i]

        for axis, val in pairs(self.props[i].offset) do
            self.props[i].offset[axis] = val + 0.0
        end

        for axis, val in pairs(self.props[i].rotation) do
            self.props[i].rotation[axis] = val + 0.0
        end
    end

    ---@type "prop" | "particle"
    self.currMode = "prop"

	---@class AnimationData
	---@field dict string
	---@field clip string
	---@field animSpeedIdx integer
	---@field speedMultiplier number
	---@field loopingAnimation boolean
	---@field stoppedAnim integer
	---@field startAnimDelay integer
	---@field getAnimDur fun(): number

	---@type AnimationData
    self.anim = {
        dict = data.dict,
        clip = data.clip,
        animSpeedIdx = 10,
        speedMultiplier = 0.05,
        loopingAnimation = true,
        stoppedAnim = 0,
        startAnimDelay = 1500, -- waitBetween
        getAnimDur = function()
            return math.floor(GetAnimDuration(self.anim.dict, self.anim.clip) * 100) / 100
        end,
    }

    local ply = PlayerPedId()
    FreezeEntityPosition(ply, true)

    local pos = position.getPosition()
    SetEntityCoords(ply, pos.x, pos.y, pos.z, false, false, false, false)

    self:EnsureProps()
    self:SetGizmoEntity()

    self.buttons.items = {
        {label = T("instruct:save"), key = "ENTER", func = function()
            self:Reset()
            SetNuiFocus(false, false)
            SendNUIMessage({event = "setGizmoEntity", data = {handle = nil}})
        end},
        {label = T("instruct:exit"), key = "BACKSPACE", func = function()
            self:Reset()
            SetNuiFocus(false, false)
            SendNUIMessage({event = "setGizmoEntity", data = {handle = nil}})
        end},
        {label = T("instruct:toggleFocus"), key = "LEFTSHIFT", func = function(keyCode)
            SetNuiFocus(true, true)
            SetNuiFocusKeepInput(true)
            SetCursorLocation(0.5, 0.5)

            CreateThread(function()
                Wait(25)

                while (IsDisabledControlPressed(0, keyCode)) do
                    self:RestrictMovement()
                    self:RestrictCameraPan()
                    Wait(1)
                end

                SetNuiFocus(false, false)
                SetNuiFocusKeepInput(false)
            end)
        end},
        {label = T("instruct:toggleRot"), key = "R",
            func = function()
            end,
            isInactive = function()
                return self.currMode == "particle"
            end
        },
        {label = T("instruct:toggleAnim"), key = "X", func = function()
            self.anim.loopingAnimation = not self.anim.loopingAnimation

            if (not self.anim.loopingAnimation) then
                ClearPedTasks(ply)
            else
                self:EnsureAnim(true)
            end
        end},
        {label = "Speed", key = {"SCROLLDOWN", "SCROLLUP"},
            getLabel = function()
                return T("instruct:speed"):format(tostring(self.anim.animSpeedIdx * self.anim.speedMultiplier))
            end,
            func = function(keyCode, key)
                if (key == "SCROLLDOWN") then
                    self.anim.animSpeedIdx -= 1
                else
                    self.anim.animSpeedIdx += 1
                end

                local maxSpeed = 2.0
                if ((self.anim.animSpeedIdx * self.anim.speedMultiplier) < self.anim.speedMultiplier) then self.anim.animSpeedIdx = 1 end
                if ((self.anim.animSpeedIdx * self.anim.speedMultiplier) > 2.0) then self.anim.animSpeedIdx = math.floor(maxSpeed / self.anim.speedMultiplier) end

                SetEntityAnimSpeed(ply, self.anim.dict, self.anim.clip, self.anim.animSpeedIdx * self.anim.speedMultiplier)
                self.buttons:ensureLabels()
                ClearPedTasks(ply)
            end
        },
        {label = "Iterate Current", key = {"UP", "DOWN"},
            getLabel = function()
                if (self.currMode == "prop") then
                    return T("instruct:currProp"):format(self.propIdx, #self.props)
                else
                    return T("instruct:currParticle"):format(self.particleIdx, #self.props[self.propIdx].particles)
                end
            end,
            func = function(_, key)
                if (self.currMode == "prop") then
                    local propsLen = #self.props
                    if (propsLen == 1) then return end

                    self.propIdx = key == "UP" and self.propIdx == 1 and propsLen or self.propIdx - 1
                    if (self.propIdx > propsLen) then self.propIdx = 1 end
                    if (self.propIdx == 0) then self.propIdx = propsLen end

                    self.particleIdx = self.hasParticles and 1 or 0

                    if (self.propHighlight) then
                        self:ClearHighlight()
                        self:HighlightCurrent()
                    end
                else
                    local particlesLen = #self.props[self.propIdx].particles
                    if (particlesLen == 1) then return end

                    self.particleIdx = key == "UP" and self.particleIdx == 1 and particlesLen or self.particleIdx - 1
                    if (self.particleIdx > particlesLen) then self.particleIdx = 1 end
                    if (self.particleIdx == 0) then self.particleIdx = particlesLen end

                    if (self.propHighlight) then
                        self:HighlightCurrent()
                    end
                end

                self:SetGizmoEntity()
                self.buttons:ensureLabels()
            end
        },
        {label = "Mode", key = "G",
            isInactive = function()
                return not self.hasParticles
            end,
            getLabel = function()
                return self.currMode == "prop" and T("instruct:propMode") or T("instruct:particleMode")
            end,
            func = function()
                self.propIdx = 1
                self.particleIdx = self.hasParticles and 1 or 0

                self:ClearHighlight()

                self.currMode = self.currMode == "prop" and "particle" or "prop"
                self.buttons:ensureLabels()
                self:SetGizmoEntity()
            end
        },
        {label = "Highlight Current", key = "H", func = function()
            if (self.propHighlight) then
                self:ClearHighlight()
            else
                self:HighlightCurrent()
            end
        end}
    }

    self.buttons:ensureLabels()

    self:EnsureAnim(true)
    while (Alignment.active == self) do
        ply = PlayerPedId()
        self.scaleform:render()
        self.scaleform:handleButtons()

        self:RestrictMovement()
        self:EnsureAnim()

        if (self.hasParticles) then
            self:HighlightParticleOrigins()
            self:EnsureParticles()
        end

        Z.drawText(("Anim. Progress: %s/%ss"):format(math.floor(GetEntityAnimCurrentTime(ply, self.anim.dict, self.anim.clip) * self.anim:getAnimDur() * 100) / 100, self.anim:getAnimDur()), 0.9, 0.9, nil, nil, "right")

        SendNUIMessage({
            event = "setCameraPosition",
            data = {
                position = GetFinalRenderedCamCoord(),
                rotation = GetFinalRenderedCamRot(0)
            }
        })

        -- Disable idle stuff
        DisableIdleCamera(true)
        SetPedCanPlayAmbientIdles(ply, true, true)
        SetPedCanPlayAmbientAnims(ply, false)
        SetPedCanPlayAmbientBaseAnims(ply, false)
        SetPedCanHeadIk(ply, false)
        SetPedCanPlayGestureAnims(ply, false)
        ClearPedSecondaryTask(ply)

        Wait(0)
    end

	-- Block the pause menu for a bit afterwards
    -- Without a loop like this it doesn't block properly
    CreateThread(function()
        local started = GetGameTimer()

        while (GetGameTimer() - started < 100) do
            SetPauseMenuActive(false)
            DisableControlAction(0, 199, true) -- P
            DisableControlAction(0, 200, true) -- ESC

            Wait(1)
        end
    end)

    for i = 1, #self.props do
        if (self.props[i].particles) then
            for j = 1, #self.props[i].particles do
                local particleData = self.props[i].particles[j]

                if (particleData.handle and DoesParticleFxLoopedExist(particleData.handle)) then
                    StopParticleFxLooped(particleData.handle, false)
                    RemoveNamedPtfxAsset(particleData.dict)
                    particleData.handle = nil
                end
            end
        end
    end

    for i = 1, #self.props do
        self.props[i].entity = nil
        self.props[i].tempId = nil
    end

    local retVal = {
        dict = self.anim.dict,
        clip = self.anim.clip,
        props = self.props,
    }

    AddToHistory(retVal)

    SetAlignmentData(retVal, "prev")
    SendNUIMessage({event = "SetSuspension", data = false})
    SetNuiFocus(true, true)

    -- Reset idle stuff
    DisableIdleCamera(false)
    SetPedCanPlayAmbientIdles(ply, true, true)
    SetPedCanPlayAmbientAnims(ply, true)
    SetPedCanPlayAmbientBaseAnims(ply, true)
    SetPedCanHeadIk(ply, true)
    SetPedCanPlayGestureAnims(ply, true)

	return retVal
end

exports("StartEditing", function(data, alignmentPosition)
	Alignment:Enter(data, alignmentPosition)
end)