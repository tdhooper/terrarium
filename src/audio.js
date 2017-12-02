const howler = require('howler');

const Audio = function(eventMediator) {

    var globalVolume = 0;
    howler.Howler.volume(globalVolume);

    var ambience = new howler.Howl({
        src: ['audio/ambience.mp3'],
        loop: true,
        autoplay: true,
        volume: .5
    });

    eventMediator.on('crystal.growth', progress => {
        var volume = Math.max(progress, globalVolume);
        if (volume !== globalVolume) {
            globalVolume = volume;
            howler.Howler.volume(Math.pow(volume, 2));
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
        hyper.volume(power);
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
