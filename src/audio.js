const howler = require('howler');

const Audio = function(eventMediator) {

    var globalVolume = 0;
    howler.Howler.volume(globalVolume);

    var ambience = new AudioLoop({
        src: ['audio/ambience.mp3'],
        loopPoint: 19250,
        volume: .5
    });

    ambience.play();

    eventMediator.on('crystal.growth', progress => {
        var volume = Math.max(progress, globalVolume);
        if (volume !== globalVolume) {
            globalVolume = volume;
            howler.Howler.volume(Math.pow(volume, 2));
        }
    });

    var hyperPlaying = false;

    var hyper = new AudioLoop({
        src: ['audio/hyper.mp3'],
        volume: 0,
        loopPoint: 4790
    });

    eventMediator.on('hyper-power', power => {
        if (power && ! hyperPlaying) {
            hyper.play();
            hyperPlaying = true;
        }
        hyper.volume(power);
        if (! power && hyperPlaying) {
            hyper.stop();
            hyperPlaying = false;
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


const AudioLoop = function(spec) {
    var startPoint = spec.startPoint || 0;
    var loopPoint = spec.loopPoint;
    if ( ! loopPoint) {
        throw new Error('Specify a loopPoint');
    }
    if (startPoint >= loopPoint) {
        throw new Error('startPoint must be before loopPoint');
    }
    this.loopPoint = loopPoint;
    this.startPoint = startPoint;

    this.sound = new howler.Howl(spec);
};

AudioLoop.prototype.play = function() {
    this.sound.once('seek', () => {
        this.timeout = setTimeout(this._loop.bind(this), this.loopPoint - this.startPoint);
    });
    var id = this.sound.play();
    this.sound.seek(this.startPoint / 1000, id);
};

AudioLoop.prototype.stop = function() {
    clearTimeout(this.timeout);
    this.sound.stop();
};

AudioLoop.prototype.volume = function(volume) {
    this.sound.volume(volume);
};

AudioLoop.prototype.mute = function(mute) {
    this.sound.mute(mute);
};

AudioLoop.prototype._loop = function() {
    this.sound.once('play', () => {
        this.timeout = setTimeout(this._loop.bind(this), this.loopPoint);
    });
    this.sound.play();
};


module.exports = Audio;
