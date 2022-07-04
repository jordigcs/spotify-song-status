const {
    Plugin
} = require('powercord/entities');
const {
    getModule
} = require('powercord/webpack');
const SpotifyAPI = require('../pc-spotify/SpotifyAPI');

var statusBefore = "";
var last;
var prefix;
var active;
var letter_case;
var interval;
module.exports = class SpotifyAsStatus extends Plugin {
    async startPlugin() {
        this.setStatusToSong();
        prefix = window.localStorage.getItem("spotify_status_prefix");
        console.log(prefix);
        active = window.localStorage.getItem("spotify_status_active");
        letter_case = window.localStorage.getItem("spotify_letter_case");
        if (prefix == null) {
            window.localStorage.setItem("spotify_status_prefix", "Listening to ");
            prefix = "Listening to ";
        }
        if (active == null) {
            window.localStorage.setItem("spotify_status_active", true);
            active = true;
        }
        if (letter_case == null) {
            window.localStorage.setItem("spotify_letter_case", -1);
            letter_case = -1;
        }
        interval = window.setInterval(this.setStatusToSong, 7750);

        powercord.api.commands.registerCommand({
            command: 'spotify_prefix',
            description: 'Prefix used in Spotify song name status. Default: `Listening to `',
            usage: '{c} [prefix]',
            executor: (args) => {
                console.log(args);
                prefix = " ";
                if (args[0] != null) {
                    let str = "";
                    for (var i = 0; i < args.length; i++) {
                        console.log(i);
                        if (i != args.length - 1) {
                            str += args[i] + " ";
                        } else {
                            str += args[i];
                        }
                    }
                    if (str.substring(0, str.length - 1) != " ") {
                        str += " ";
                    }
                    prefix = str;
                    this.setStatusToSong();
                    window.localStorage.setItem("spotify_status_prefix", prefix);
                    return {
                        send: false,
                        result: `Set prefix to \`${prefix}\``
                    };
                }

                this.setStatusToSong();
                window.localStorage.setItem("spotify_status_prefix", prefix);
                return {
                    send: false,
                    result: `No prefix provided. Setting prefix to none.`
                };
            }
        });
        powercord.api.commands.registerCommand({
            command: 'spotify_toggle',
            description: 'Toggle Spotify Status Setter.',
            usage: '{c}',
            executor: (args) => {
                active = !active;
                window.localStorage.setItem("spotify_status_active", active);
                return {
                    send: false,
                    result: 'Toggled Spotify Status Setter. `active=' + active + '`'
                };
            }
        });
        powercord.api.commands.registerCommand({
            command: 'spotify_letter_case',
            description: 'Set Spotify Status to lowercase',
            usage: '{c} [lower | upper | default (no change)]',
            executor: (args) => {
                if (args[0] != null) {
                    switch (args[0]) {
                        case "lower":
                            letter_case = 0;
                            break;
                        case "upper":
                            letter_case = 1;
                        case "reg", "regular", "default":
                            letter_case = -1;
                    }
                    window.localStorage.setItem("spotify_letter_case", letter_case);
                    this.setStatusToSong();
                    return {
                        send: false,
                        result: `Letter case set.`
                    };
                } else {

                    return {
                        send: false,
                        result: `No arguments provided.`
                    };
                }
            }
        });
        powercord.api.commands.registerCommand({
            command: 'update_spotify_status',
            description: 'Force update spotify status',
            usage: '{c}',
            executor: (args) => {
                this.setStatusToSong();
                return {
                    send: false,
                    result: `Force updating status.`
                };
            }
        });
    }

    setStatusToSong() {
        if (prefix === undefined) {
            prefix = "Listening to ";
        }
        let current_prefix = prefix;
        let remoteSettings = getModule(['updateRemoteSettings'], false);

        let userSettings = getModule(['guildPositions'], false);

        let songName = "";
        let status = "";
        var currentStatus = "";
        if (userSettings["customStatus"] != null && "text" in userSettings["customStatus"]) {
            currentStatus = userSettings["customStatus"]["text"];
        }

        SpotifyAPI.getPlayer()
            .then((player) => {
                if (player.item != last) {
                    if (player.item != null && player.is_playing && active) {
                        last = player.item;
                        songName = player.item.name;


                        switch (letter_case) {
                            case 0:
                                songName = songName.toLowerCase();
                                current_prefix = current_prefix.toLowerCase();
                                break;
                            case 1:
                                songName = songName.toUpperCase();
                                current_prefix = current_prefix.toLowerCase();
                                break;
                            case _:
                                break;
                        }
                        if (currentStatus != current_prefix + songName) {
                            console.log("Setting status to Spotify Song!");
                            status = current_prefix + songName;
                            remoteSettings.updateRemoteSettings({
                                "customStatus": {
                                    "text": status
                                }
                            });
                            return;
                        }
                    } else {
                        if (!active) {
                            if (interval != -1) {
                                window.clearInterval(interval);
                                interval = -1;
                            }
                        }
                        if (status != "") {
                            if (statusBefore != "") {
                                status = statusBefore;
                            } else {
                                status = "";
                            }
                        }
                        remoteSettings.updateRemoteSettings({
                            "customStatus": {
                                "text": status
                            }
                        });
                    }
                    if (currentStatus != current_prefix + songName) {
                        //console.log(fullStatus);
                        statusBefore = currentStatus;
                    }
                } else {
                    if (status != "") {
                        if (statusBefore != "") {
                            status = statusBefore;
                        } else {
                            status = null;
                        }
                    }
                    remoteSettings.updateRemoteSettings({
                        "customStatus": {
                            "text": status
                        }
                    });
                }
            })
            .catch((e) => {
                console.log(e);
                if (status != "") {
                    if (statusBefore != "") {
                        status = statusBefore;
                    } else {
                        status = "";
                    }
                }
                remoteSettings.updateRemoteSettings({
                    "customStatus": {
                        "text": status
                    }
                });
            });
    }

    pluginWillUnload() {
        powercord.api.commands.unregisterCommand('spotify_prefix');
        powercord.api.commands.unregisterCommand('spotify_toggle');
        powercord.api.commands.unregisterCommand('spotify_letter_case');
        powercord.api.commands.unregisterCommand('update_spotify_status');
    }
};