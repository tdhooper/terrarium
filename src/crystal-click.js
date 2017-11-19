
const CrystalClick = function(parent, app) {
    app.interactionPublisher.add(parent, 'crystal', true);

    const state = {
        isDown: false,
        cursorVisible: false,
        isOver: false,
        hover: function(state) {
            return state.isOver && ! state.cursorVisible;
        },
    };

    const stateChange = {
        hover: function(value) {
            this.hover(value);
        }.bind(this)
    };

    var lastState = state;

    var getValue = function(state, key) {
        var property = state[key];
        if (typeof property === 'function') {
            return property(state);
        }
        return property;
    };

    var publishState = function() {
        Object.keys(stateChange).forEach(key => {
            var value = getValue(state, key);
            var lastValue = getValue(lastState, key);
            if (value !== lastValue) {
                stateChange[key](value);
            }
        });
        lastState = Object.assign({}, state);
    };

    app.eventMediator.on('soil-cursor.visible', function() {
        state.cursorVisible = true;
        publishState();
    });

    app.eventMediator.on('soil-cursor.hidden', function() {
        state.cursorVisible = false;
        publishState();
    });

    app.eventMediator.on('crystal.mousedown', function() {
        state.isDown = true;
        publishState();
    });

    app.eventMediator.on('crystal.mouseup', function() {
        if (state.isDown && ! state.cursorVisible) {
            this.click();
        }
    }.bind(this));

    app.eventMediator.on('scene.mouseup', function() {
        state.isDown = false;
        publishState();
    });

    app.eventMediator.on('crystal.mouseover', function() {
        state.isOver = true;
        publishState();
    });

    app.eventMediator.on('crystal.mouseout', function() {
        state.isOver = false;
        publishState();
    });
};

CrystalClick.prototype.hover = function(on) {
    if (on) {
        document.body.classList.add('show-pointer');
    } else {
        document.body.classList.remove('show-pointer');
    }
};


CrystalClick.prototype.click = function() {
    console.log('click');
};


module.exports = CrystalClick;
