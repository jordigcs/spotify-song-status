const { Plugin } = require('powercord/entities');
const { getModule } = require('powercord/webpack');
const SpotifyAPI = require('../pc-spotify/SpotifyAPI');

var statusBefore = {};
var last;
module.exports = class SpotifyAsStatus extends Plugin {
    async startPlugin() {

        this.setStatusToSong();

        window.setInterval(this.setStatusToSong, 7750);
    }

    async setStatusToSong() {
        let remoteSettings = getModule([ 'updateRemoteSettings' ], false);

        SpotifyAPI.getPlayer()
        .then((player) => {
        if(player.item != last) {
        let userSettings = getModule([ 'guildPositions' ], false);

        let songName = "";
        let currentStatus = "";
        let fullStatus = {};
        if(userSettings != null) { 
            fullStatus = userSettings.customStatus;
            if(fullStatus["text"] != null) {
                currentStatus = fullStatus.text;
            }
        }
        console.log(currentStatus.includes("Listening to "));
        if(!currentStatus.includes("Listening to ")) {
            //console.log(fullStatus);
            statusBefore = currentStatus;
        }
        else {
            console.log("found");
        }
            if(player.item != null && player.is_playing) {
                last = player.item;
                songName = player.item.name;
                if(currentStatus != "Listening to " + songName) {
                    console.log("Setting status to Spotify Song!");
                    fullStatus["text"] = "Listening to " + songName;
                    remoteSettings.updateRemoteSettings(fullStatus);
                }
            }
            else {
                console.log("No playing or no item" + currentStatus);
                console.log(statusBefore);
                fullStatus["text"] = statusBefore;
                remoteSettings.updateRemoteSettings(fullStatus);
            }
        }
        else {
            fullStatus["text"] = statusBefore;
            remoteSettings.updateRemoteSettings(fullStatus);
        }
    })
        .catch((e) => {
            fullStatus["text"] = statusBefore;
            remoteSettings.updateRemoteSettings(fullStatus);
        }
        );
    }

    pluginWillUnload() {
    }
};
