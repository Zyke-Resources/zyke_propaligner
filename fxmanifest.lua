fx_version "cerulean"
game "gta5"
lua54 "yes"
version "1.5.0"

shared_script "@zyke_lib/imports.lua"

loader {
    -- Dependencies
    "server:@oxmysql/lib/MySQL.lua",

    -- Shared
    "shared/config.lua",
    "shared/bones.lua",

    -- Server
    "server/database.lua",
    "server/events.lua",

    -- Client
    "client/functions.lua",
	"client/commands.lua",
	"client/events.lua",
	"client/alignment.lua",
}

ui_page "nui/index.html"
-- ui_page "nui_source/hot_reload.html"

files {
    "nui/**/*",
    -- "nui_source/hot_reload.html",

    "locales/*.lua",
    "shared/animations.lua",
    "client/**/*",
    "shared/**/*",
}

dependency "zyke_lib"