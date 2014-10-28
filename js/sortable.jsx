(function() {

var PT    = React.PropTypes;

var sortableDragging = {
    cursor: "ns-resize"
};

var sortableEnabled = {
    cursor: "pointer"
};

var userSelect = rhs => {
    return {
        "-webkit-user-select": rhs,
        "-khtml-user-drag": rhs,
        "-khtml-user-select": rhs,
        "-moz-user-select": rhs,
        "-ms-user-select": rhs,
        userSelect: rhs
    };
};

var sortableDisabled = userSelect("none");

// Takes an array of components to sort
window.SortableArea = React.createClass({
    propTypes: {
        data: PT.array.isRequired,
        onReorder: PT.func.isRequired,
        verify: PT.func
    },
    render: function() {
        var sortables = _(this.state.components).map((component, index) =>
            <SortableItem
                index={index}
                data={component.props.data}
                component={component}
                area={this}
                key={component.key}
                outside={this.state.outside}
                draggable={component.props.draggable}
                dragging={index === this.state.dragging} />
        );
        return <ol className={this.props.className} style={this.props.style}
            onDragEnter={this.dragEnter}
            onDragLeave={this.dragLeave}
            onDragOver={this.dragOver}
            onDragEnd={this.dragEnd}
            onDrop={this.drop}>
            {sortables}
        </ol>;
    },
    getDefaultProps: function() {
        return {
            verify: () => true,
            reorder: true
        };
    },
    getInitialState: function() {
        this.dragDepth = 0;

        return {
            // index of the component being dragged
            dragging: null,
            components: this.mapComponents(this.props.data),
            outside: false
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            components: this.mapComponents(nextProps.data)
        });
    },
    mapComponents: function(components) {
        return components.map(function(data) {
            return this.props.genComponent(data);
        }.bind(this));
    },
    isDragging: function() {
        return (this.state.dragging !== null);
    },
    dragEnter: function(e) {
        if (this.dragDepth === 0) {
            e.preventDefault();
            this.handleDragEnter(e);
        }

        this.dragDepth += 1;
    },
    dragLeave: function(e) {
        this.dragDepth -= 1;

        if (this.dragDepth === 0) {
            this.handleDragLeave(e);
        }
    },
    handleDragEnter: function(e) {
        if (!this.isDragging()) {
            var index = this.state.components.length;
            var data = SortableItem.curDragData;
            var component = this.props.genComponent(data);

            this.setState({
                itemAdded: component,
                dragging: index,
                components: this.state.components.concat([component])
            });
        } else {
            this.setState({ outside: false });
        }
    },
    handleDragLeave: function(e) {
        if (this.state.itemAdded) {
            var component = this.state.itemAdded;
            var components = this.state.components;
            var itemPos = components.indexOf(component);
            components.splice(itemPos, 1)
            this.setState({
                outside: false,
                components: components,
                itemAdded: false,
                dragging: null
            });
        } else if (this.isDragging()) {
            this.setState({ outside: true });
        }
    },
    dragOver: function(e) {
        // We only want to accept text being copied over
        if (SortableItem.curDragData) {
            e.preventDefault();
        }
    },
    reset: function() {
        this.dragDepth = 0;

        this.setState({
            itemAdded: false,
            dragging: null,
            outside: false
        });
    },
    dragEnd: function(e) {
        this.reset();
    },
    drop: function(e) {
        this.reset();
    },
    // Alternatively send each handler to each component individually,
    // partially applied
    onDragStart: function(startIndex) {
        this.setState({
            itemAdded: false,
            dragging: startIndex,
            outside: false
        });
    },
    onDragEnd: function() {
        this.reset();
        // tell the parent component
        this.props.onReorder(this.state.components);
    },
    onDragEnter: function(enterIndex) {
        // When a label is first dragged it triggers a dragEnter with itself,
        // which we don't care about.
        if (this.state.dragging === enterIndex ||
                !this.isDragging() ||
                !this.props.reorder) {
            return;
        }

        var newComponents = this.state.components.slice();

        // splice the tab out of its old position
        var removed = newComponents.splice(this.state.dragging, 1);
        // ... and into its new position
        newComponents.splice(enterIndex, 0, removed[0]);

        var verified = this.props.verify(newComponents);
        if (verified) {
            this.setState({
                dragging: enterIndex,
                components: newComponents
            });
        }
        return verified;
    },

    // Firefox refuses to drag an element unless you set data on it. Hackily
    // add data each time an item is dragged.
    componentDidMount: function() {
        this._setDragEvents();
    },
    componentDidUpdate: function() {
        this._setDragEvents();
        if (this.state.updateCursor) {
            //this.state.updateCursor.setDragImage(
            //    this.getDOMNode().querySelector(".sortable-dragging").firstChild, 0, 0);
            this.setState({ updateCursor: false });
        }
    },
    _listenEvent: function(e) {
        e.dataTransfer.setData('hackhackhack', 'because browsers!');
    },
    _cancelEvent: function(e) {
        // prevent the browser from redirecting to 'because browsers!'
        e.preventDefault();
    },
    _setDragEvents: function() {
        this._dragItems = this._dragItems || [];
        var items = this.getDOMNode().querySelectorAll('[draggable=true]');
        var oldItems = _(this._dragItems).difference(items);
        var newItems = _(items).difference(this._dragItems);

        _(newItems).each(dragItem => {
            dragItem.addEventListener('dragstart', this._listenEvent);
            dragItem.addEventListener('drop',      this._cancelEvent);
        });

        _(oldItems).each(dragItem => {
            dragItem.removeEventListener('dragstart', this._listenEvent);
            dragItem.removeEventListener('drop',      this._cancelEvent);
        });
    }
});

// An individual sortable item
window.SortableItem = React.createClass({
    propTypes: {
        // item: what is this?
    },
    render: function() {
        var dragState = "sortable-disabled";
        if (this.props.dragging) {
            dragState = "sortable-dragging";
        } else if (this.props.draggable) {
            dragState = "sortable-enabled";
        }

        if (this.props.outside) {
            dragState += " sortable-outside";
        }

        return <li draggable={this.props.draggable}
                   className={dragState}
                   onDragStart={this.handleDragStart}
                   onDragEnd={this.handleDragEnd}
                   onDragEnter={this.handleDragEnter}
                   onDragOver={this.handleDragOver}>
            {this.props.component}
        </li>;
    },
    handleDragStart: function(e) {
        SortableItem.curDragData = this.props.data;
        e.nativeEvent.dataTransfer.effectAllowed = "move";
        this.props.area.onDragStart(this.props.index);
    },
    handleDragEnd: function() {
        SortableItem.curDragData = null;
        this.props.area.onDragEnd(this.props.index);
    },
    handleDragEnter: function(e) {
        var verified = this.props.area.onDragEnter(this.props.index);
        // Ideally this would change the cursor based on whether this is a
        // valid place to drop.
        e.nativeEvent.dataTransfer.effectAllowed = verified ? "move" : "none";
    },
    handleDragOver: function(e) {
        // allow a drop by preventing default handling
        e.preventDefault();
    }
});

})();

var FromToContainer = React.createClass({
    render: function() {
        return <div>
            <ToContainer data={this.props.to}
                genComponent={this.props.genComponent}/>
            <FromContainer data={this.props.from}
                genComponent={this.props.genComponent}/>
        </div>;
    }
});

var DragItem = React.createClass({
    render: function() {
        return <div className="item">{this.props.data}</div>;
    }
});

var FromContainer = React.createClass({
    render: function() {
        return <div className="from">
            <SortableArea
                className="from"
                data={this.props.data}
                genComponent={this.props.genComponent}
                onReorder={() => true}
                reorder={false}/>
        </div>;
    }
});

var ToContainer = React.createClass({
    render: function() {
        return <div className="to">
            <SortableArea
                className="to"
                data={this.props.data}
                genComponent={this.props.genComponent}
                onReorder={() => true}/>
        </div>;
    }
});

// TODO: Destory To drag on leave drop
// TODO: Don't accept items in the From container

$(function() {
    var key = 1;
    var genDragItem = function(data) {
        return <DragItem data={data} key={key++} draggable={true}/>;
    };

    var from = ["1", "2", "3"];
    var to = ["4", "5", "6"];

    React.render(
        <FromToContainer from={from} to={to}
            genComponent={genDragItem}/>,
        $("#output")[0]
    );
});