[![ko-fi banner2](https://github.com/user-attachments/assets/42eff455-5757-4888-ad88-d61893edcc33)](https://ko-fi.com/zykeresources)

# [> Download](https://github.com/ZykeWasTaken/zyke_propaligner/releases/latest)

# Information

This is an easy-to-use solution to your prop alignment hell. With our sleek UI you can utilize inputs, history & presets to speed up your alignment for your props.

The entire project is the first effort to make a great alignment menu, and more updates to streamline the process will come in the future once I am available to work on it.

# Features

-   Sleek & modern UI for all inputs along with smart validation.
-   Supports multiple props.
-   Offset & rotation to player.
-   Particle alignments offset from the prop.
-   Possible to integrate into resources using exports, provide & return alignments with ease.
-   Plays animation for realistic interactions, with different speeds.
-   Server-wide presets to load pre-defined configurations.
-   Export & import presets to share.
-   Client-sided history to save your recent configurations.
-   Visualize the data in Lua & JSON format for easy implementation.

## Get Started

-   Open the menu via the command in the config, `/palign` by default.
-   Start filling out the information, or go to `Presets` to import a base to get started from.

## Demo Presets

You can paste these presets into the import input, press the import button and try them out.

### Plate With Curry

```json
{
    "label": "Curry (Dual Prop)",
    "data": {
	"dict": "anim@scripted@island@special_peds@pavel@hs4_pavel_ig5_caviar_p1",
        "clip": "base_idle",
        "props": [
            {"rotation": {"x": 0, "y": 0, "z": -50}, "prop": "prop_cs_plate_01", "bone": 60309, "offset": {"x": 0, "y": 0, "z": 0}},
            {"rotation": {"x": 180, "y": 180, "z": 0}, "prop": "prop_cs_fork", "bone": 28422, "offset": {"x": 0, "y": 0, "z": 0}}
        ]
    }
}
```

### Water Bottle

```json
{
    "label": "Water Bottle",
    "data": {
	"dict": "mp_player_intdrink",
        "clip": "loop_bottle",
        "props": [
            {"rotation": {"x": -103.202, "y": -68.066, "z": 2.814}, "prop": "prop_ld_flow_bottle", "bone": 18905, "offset": {"x": 0.122, "y": -0.038, "z": 0.033}}
        ]
    }
}
```

### Burger
```json
{
    "label": "Burger",
    "data": {
        "dict": "mp_player_inteat@burger",
        "clip": "mp_player_int_eat_burger",
        "props":[
            {"bone": 18905, "model": "prop_cs_burger_01", "rotation": {"x": 31.162, "y": 136.033, "z": -13.003}, "prop": "prop_cs_burger_01", "offset": {"x": 0.144, "y": 0.027, "z": 0.040}}
        ]
    }
}
```

### Soda Can (Sprunk)
```json
{
    "label":"Soda Can",
    "data": {
        "dict":"mp_player_intdrink",
        "clip":"loop_bottle",
        "props": [
            {"bone": 18905,"model": "prop_ld_can_01b", "rotation": {"x":-103.202,"y":-68.066,"z":2.814}, "prop": "prop_ld_can_01b", "offset":{"x": 0.122, "y": -0.007, "z": 0.035}}
        ]
    }
}
```

### Cigarette

```json
{
    "label": "Cigarette & Particles",
    "data": {
        "dict": "amb@world_human_aa_smoke@male@idle_a",
        "clip": "idle_a",
        "props": [
            {"bone": 64097, "prop": "ng_proc_cigarette01a", "rotation": {"x": 100, "y": 0, "z": 100}, "offset": {"x": 0.02, "y": 0.02, "z": -0.008},
                "particles": [
                    {"clip": "exp_grd_bzgas_smoke", "size": 1, "dict": "core", "offset": {"x": -0.068, "y": 0.0, "z": 0.0}}
                ]
            }
        ]
    }
}
```

## Resource Integration Example

Use `ConfigureAlignments` when another resource should open propaligner, let the player edit the data, and receive the edited result back.

```lua
local alignment = {
    dict = "amb@world_human_aa_smoke@male@idle_a",
    clip = "idle_a",
    props = {
        {
            prop = "ng_proc_cigarette01a",
            bone = 64097,
            offset = {x = 0.02, y = 0.02, z = -0.008},
            rotation = {x = 100.0, y = 0.0, z = 100.0},
            particles = {
                {
                    dict = "scr_recartheft",
                    clip = "scr_wheel_burnout",
                    offset = {x = -0.068, y = 0.0, z = 0.0},
                    size = 0.03
                }
            }
        }
    }
}

local result = exports["zyke_propaligner"]:ConfigureAlignments(alignment, true)
if (not result) then return end

print(json.encode(result))
```

### Restricting Fields

If a value should be displayed but edited somewhere else in your resource, pass `restrictedFields`. The field stays visible, but the input is disabled and shows your tooltip on hover.

```lua
local result = exports["zyke_propaligner"]:ConfigureAlignments({
    dict = "amb@world_human_aa_smoke@male@idle_a",
    clip = "idle_a",
    props = {
        {
            prop = "ng_proc_cigarette01a",
            bone = 64097,
            offset = {x = 0.02, y = 0.02, z = -0.008},
            rotation = {x = 100.0, y = 0.0, z = 100.0},
            particles = {
                {
                    dict = "scr_recartheft",
                    clip = "scr_wheel_burnout",
                    offset = {x = -0.068, y = 0.0, z = 0.0},
                    size = 0.03
                }
            }
        }
    },
    restrictedFields = {
        ["particles.size"] = {
            disabled = true,
            tooltip = "Particle size is controlled by the smoking item settings."
        }
    }
}, true)
```

`restrictedFields` also accepts shorthand values:

```lua
restrictedFields = {
    ["particles.size"] = "Edit this in your own menu instead.",
}
```

Collection fields can also restrict how many entries can be added:

```lua
restrictedFields = {
    ["particles"] = {
        maxCount = 1,
        tooltip = "Smoking particles only support one particle."
    }
}
```

Restrictions are resolved by field path. A specific key such as `particles.size` only affects that field, while a broader key such as `particles` can be used by any particle input that supports restrictions. More specific keys override broader ones.

## Showcase

<img src="https://github.com/user-attachments/assets/9d91ec51-8fb7-40cb-bf23-59148d8c36f0" style="width: 800px; height: auto;">

<img src="https://github.com/user-attachments/assets/543885d7-ca03-4374-b473-83085684f182" style="width: 800px; height: auto;">

<img src="https://r2.fivemanage.com/mS9apQyi6ahmBBRtVnQAv/PropalignerShowcaseAlignment.png" style="width: 800px; height: auto;">

<img src="https://github.com/user-attachments/assets/05c04642-e1ec-4eea-b534-17ccbec75dc3" style="width: 800px; height: auto;">

## Development Details

-   We use a rotation order of 1, see [native documentation](https://docs.fivem.net/natives/?_0xAFBD61CC738D9EB9) for more info.

## Dependencies

-   [zyke_lib](https://github.com/ZykeWasTaken/zyke_lib)

## General Links

-   [Discord Community](https://discord.gg/zykeresources)
-   [Store](https://store.zykeresources.com)
-   [Documentation](https://docs.zykeresources.com/free-resources/propaligner)

## Credits

-   https://github.com/DemiAutomatic/object_gizmo
-   https://github.com/TGIANN/tgiann-attachproptoplayereditor
