const howler = require('howler');

const Audio = function(eventMediator) {

    var ambience = new howler.Howl({
        src: ['audio/ambience.mp3'],
        autoplay: true,
        loop: true,
        volume: .5
    });

    var hyperVolume = 0;

    var hyper = new howler.Howl({
        src: ['audio/hyper.mp3'],
        autoplay: true,
        loop: true,
        volume: hyperVolume
    });

    eventMediator.on('hyper-power', power => {
        if (hyperVolume === 0) {
            hyper.seek(0);
        }
        hyper.volume(power);
        hyperVolume = power;
    });
};

module.exports = Audio;
