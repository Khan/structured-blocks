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
        components: PT.arrayOf(PT.node).isRequired,
        onReorder: PT.func.isRequired,
        verify: PT.func
    },
    render: function() {
        var sortables = _(this.state.components).map((component, index) =>
            <SortableItem
                index={index}
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
            onDragOver={this.dragOver}>
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
        return {
            // index of the component being dragged
            dragging: null,
            components: this.props.components,
            outside: false
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({ components: nextProps.components });
    },
    dragEnter: function(e) {
        var data = SortableItem.curDragData;
        if (data) {
            if (this.state.dragging === null) {
                console.log("dragEnter!!!!", data)
                /*
                this.props.getComponent(data);
                this.setState({
                    components: this.state.components.concat([
                        <SortableItem
                            index={this.state.components}
                            component={component}
                            area={this}
                            key={component.key}
                            draggable={component.props.draggable}
                            dragging={index === this.state.dragging} />
                    ])
                });
                */
            } else {
                this.setState({ outside: false, updateCursor: e.dataTransfer });
            }
        }
        e.preventDefault();
    },
    dragLeave: function(e) {
        if (this.state.dragging === null) {
            return;
        }
        console.log("going outside")
        this.setState({ outside: true, updateCursor: e.dataTransfer });
    },
    dragOver: function(e) {
        //console.log("dragOver", e, e.nativeEvent)
        // We only want to accept text being copied over
        if (SortableItem.curDragData) {
            e.preventDefault();
        }
    },
    // Alternatively send each handler to each component individually,
    // partially applied
    onDragStart: function(startIndex) {
        this.setState({ dragging: startIndex, outside: false });
    },
    onDragEnd: function() {
        // tell the parent component
        this.setState({ dragging: null, outside: false });
        this.props.onReorder(this.state.components);
    },
    onDragEnter: function(enterIndex) {
        console.log("onDragEnter", enterIndex)
        // When a label is first dragged it triggers a dragEnter with itself,
        // which we don't care about.
        if (this.state.dragging === enterIndex ||
                this.state.dragging === null ||
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
            console.log("Updating cursor")
            this.state.updateCursor.setDragImage(
                this.getDOMNode().querySelector(".sortable-dragging").firstChild, 0, 0);
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
                   onDragLeave={this.handleDragLeave}
                   onDragOver={this.handleDragOver}>
            {this.props.component}
        </li>;
    },
    handleDragStart: function(e) {
        SortableItem.curDragData = "var a = true;";
        e.nativeEvent.dataTransfer.effectAllowed = "move";
        this.props.area.onDragStart(this.props.index);
    },
    handleDragEnd: function() {
        this.props.area.onDragEnd(this.props.index);
    },
    handleDragEnter: function(e) {
        var verified = this.props.area.onDragEnter(this.props.index);
        // Ideally this would change the cursor based on whether this is a
        // valid place to drop.
        e.nativeEvent.dataTransfer.effectAllowed = verified ? "move" : "none";
    },
    handleDragLeave: function() {
        console.log("local dragLeave")
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
            <ToContainer components={this.props.to}/>
            <FromContainer components={this.props.from}/>
        </div>;
    }
});

var DragItem = React.createClass({
    render: function() {
        return <div className="item">{this.props.name}</div>;
    }
});

var FromContainer = React.createClass({
    render: function() {
        return <div className="from">
            <SortableArea
                components={this.props.components}
                onReorder={() => true}
                reorder={false}/>
        </div>;
    }
});

var ToContainer = React.createClass({
    render: function() {
        return <div className="to">
            <SortableArea
                components={this.props.components}
                onReorder={() => true}/>
        </div>;
    }
});

$(function() {
    var from = [
        <DragItem name="1" key="1" draggable={true}/>,
        <DragItem name="2" key="2" draggable={true}/>,
        <DragItem name="3" key="3" draggable={true}/>
    ];

    var to = [
        <DragItem name="4" key="4" draggable={true}/>,
        <DragItem name="5" key="5" draggable={true}/>,
        <DragItem name="6" key="6" draggable={true}/>
    ];

    React.render(
        <FromToContainer from={from} to={to}/>,
        $("#output")[0]
    );
});