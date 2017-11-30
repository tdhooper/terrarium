const howler = require('howler');

const Audio = function(eventMediator) {

    var volumeScale = 0;

    var ambience = new howler.Howl({
        src: ['audio/ambience.mp3'],
        loop: true,
        autoplay: true,
        volume: 0
    });

    var ambienceVolume = 0;
    var ambienceVolumeSclae = .5;

    eventMediator.on('crystal.growth', progress => {
        var volume = Math.max(progress, ambienceVolume);
        if (volume !== ambienceVolume) {
            ambienceVolume = volume;

            volumeScale = Math.pow(volume, 2);
            ambience.volume(volumeScale * ambienceVolumeSclae);
        }
    });

    var hyperVolume = 0;

    var hyper = new howler.Howl({
        src: ['audio/hyper.mp3'],
        loop: true,
        volume: hyperVolume
    });

    eventMediator.on('hyper-power', power => {
        if (hyperVolume === 0) {
            hyper.play();
        }
        hyper.volume(power * volumeScale);
        hyperVolume = power;
        if (hyperVolume === 0) {
            hyper.stop();
        }
    });

    eventMediator.on('mute', () => {
        ambience.mute(true);
        hyper.mute(true);
    });

    eventMediator.on('unmute', () => {
        ambience.mute(false);
        hyper.mute(false);
    });
};

module.exports = Audio;
