var BlankInput = React.createClass({
    render: function() {
        return <div className="block block-blank">
            {this.props.children}
        </div>;
    }
});

var BlankStatements = React.createClass({
    render: function() {
        return <div className="block block-statements">
            {this.props.children}
        </div>;
    }
});