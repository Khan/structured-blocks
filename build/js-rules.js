var JSProgram = JSRules.addRule({
    mixins: [BlockMixin, JSMixin],

    statics: {
        structure: {type: "Program"}
    },

    getType: function() {
        return "program";
    },

    genMatch: function(node) {
        return {
            _: [this.props.node.body]
        };
    },

    toAST: function() {
        var ast = this.getAST();
        return {
            type: "Program",
            body: ast._[0]
        };
    },

    render: function() {
        var children = this.getChildComponents();
        return React.createElement("div", {className: "program"}, 
            React.createElement(BlankStatements, null, children._)
        );
    }
});

var JSVarAssignment = JSRules.addRule({
    mixins: [BlockMixin, JSMixin, JSASTMixin],

    statics: {
        structure: JSRules.parseStructure(function() {
            var _ = _;
        })
    },

    getType: function(match) {
        return "statement";
    },

    render: function() {
        var children = this.getChildComponents();
        return React.createElement("div", {className: "block block-statement"}, 
            'var ', children._[0], 
            ' = ', React.createElement(BlankInput, null, children._[1]), ';'
        );
    }
});

var JSIdentifier = JSRules.addRule({
    mixins: [BlockMixin, JSMixin],

    statics: {
        structure: {type: "Identifier"}
    },

    getType: function() {
        return "variable";
    },

    genMatch: function() {
        return {
            vars: {
                name: this.props.node.name
            }
        };
    },

    toAST: function() {
        return {
            type: "Identifier",
            name: this.state.vars.name
        };
    },

    onChange: function(event) {
        this.setState({vars: {name: event.target.value}});
    },

    render: function() {
        var name = this.state.vars.name;
        return React.createElement("div", {className: "block block-inline block-variable"}, 
            React.createElement("input", {type: "text", defaultValue: name, 
                onChange: this.onChange, size: name.toString().length})
        );
    }
});

var JSLiteral = JSRules.addRule({
    mixins: [BlockMixin, JSMixin],

    statics: {
        structure: {type: "Literal"}
    },

    getType: function() {
        return typeof this.props.node.value;
    },

    genMatch: function() {
        return {
            vars: {
                value: this.props.node.value
            }
        };
    },

    toAST: function() {
        return {
            type: "Literal",
            value: this.state.vars.value
        };
    },

    onChange: function(event) {
        var val = event.target.value;
        var type = this.getType();

        if (type === "boolean") {
            val = (val === "true");
        } else if (type === "number") {
            val = parseFloat(val);
        }

        this.setState({vars: {value: val}});
    },

    onBlur: function(event) {
        this.deactivate();
    },

    onKeyDown: function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            this.deactivate();
        }
    },

    deactivate: function() {
        this.setState({ active: false });
    },

    activate: function() {
        this.setState({ active: true }, function() {
            var node = this.refs.input.getDOMNode();
            node.focus();
            node.select();
        });
    },

    render: function() {
        var val = this.state.vars.value.toString();
        var className = "block block-inline block-" + this.getType();
        var activate = this.activate;

        if (!this.state.active || !this.props.editable) {
            if (!this.props.editable) {
                activate = null;
            }

            return React.createElement("div", {className: className, onClick: activate}, 
                React.createElement("span", {className: "value"}, val)
            );
        }

        return React.createElement("div", {className: className, onClick: activate}, 
            React.createElement("input", {type: "text", 
                ref: "input", 
                defaultValue: this.props.node.value, 
                size: val.toString().length, 
                onChange: this.onChange, 
                onBlur: this.onBlur, 
                onKeyDown: this.onKeyDown})
        );
    }
});