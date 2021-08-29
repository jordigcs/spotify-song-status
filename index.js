const { Plugin } = require('powercord/entities');
const { getModule } = require('powercord/webpack');
const SpotifyAPI = require('../pc-spotify/SpotifyAPI');

module.exports = class SpotifyAsStatus extends Plugin {
    async startPlugin() {

        this.setStatusToSong();

        window.setInterval(this.setStatusToSong, 5000);
    }

    async setStatusToSong() {
                
        let userSettings = getModule([ 'guildPositions' ], false);
        let remoteSettings = getModule([ 'updateRemoteSettings' ], false);

        let statusBefore = "";
        let songName = "";
        let currentStatus = "";
        let fullStatus = {};
        if(userSettings != null) { 
            fullStatus = userSettings.customStatus;
            if(fullStatus["text"] != null) {
                currentStatus = fullStatus.text;
            }
        }
        if(!currentStatus.includes("Listening to ")) {
            statusBefore = currentStatus;
        }

        SpotifyAPI.getPlayer()
        .then((player) => {
            if(player.item != null && player.is_playing) {
                songName = player.item.name;
                if(currentStatus != "Listening to " + songName) {
                    console.log("Setting status to Spotify Song!");
                    fullStatus["text"] = "Listening to " + songName;
                    remoteSettings.updateRemoteSettings(fullStatus);
                }
            }
            else {
                if(currentStatus.includes("Listening to ")) {
                    fullStatus["text"] = statusBefore;
                    remoteSettings.updateRemoteSettings(fullStatus);
                }
            }
        })
        .catch((e) => {
            fullStatus["text"] = statusBefore;
            remoteSettings.updateRemoteSettings(fullStatus);
            error('Failed to get player', e) 
        }
        );
    }

    pluginWillUnload() {
    }
};
