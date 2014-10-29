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
        return <div className="program">
            <BlankStatements>{children._}</BlankStatements>
        </div>;
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
        return <div className="block block-statement">
            {'var '}{children._[0]}
            {' = '}<BlankInput>{children._[1]}</BlankInput>{';'}
        </div>;
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
        return <div className="block block-inline block-variable">
            <input type="text" defaultValue={name}
                onChange={this.onChange} size={name.toString().length}/>
        </div>;
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

            return <div className={className} onClick={activate}>
                <span className="value">{val}</span>
            </div>;
        }

        return <div className={className} onClick={activate}>
            <input type="text"
                ref="input"
                defaultValue={this.props.node.value}
                size={val.toString().length}
                onChange={this.onChange}
                onBlur={this.onBlur}/>
        </div>;
    }
});