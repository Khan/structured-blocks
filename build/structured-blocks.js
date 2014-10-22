var BlockMixin = {
    toBlockHTML: function() {
        // NOTE: We actually want to be using the AST of
        // the rule structure, not the matched node!
        //var tokens = esprima.tokenize(this.toScript());
        return this.rule.block.call(this);
    },

    toSampleBlockHTML: function() {
        // Actually not the rule structure, but the gen
        // structure (with pre-filled vars)
    }
};

var BlankInput = React.createClass({displayName: 'BlankInput',
    render: function() {
        return React.createElement("div", {className: "block block-blank"}, 
            this.props.children
        );
    }
});

var BlankStatements = React.createClass({displayName: 'BlankStatements',
    render: function() {
        return React.createElement("div", {className: "block block-statements"}, 
            this.props.children
        );
    }
});