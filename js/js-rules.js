var JSRules = {
    rules: [],

    defaults: {
        initialize: function(options) {
            this.node = options.node;
            this.match = options.match;
            this.editable = options.editable;

            if (this.genMatch) {
                this.match = this.genMatch(this.match);
            }
        },

        getAST: function() {
            var state = this.match;
            var ret = {_: [], vars: {}};

            for (var i = 0; i < state._.length; i++) {
                var match = state._[i];
                ret._[i] = _.isArray(match) ?
                    this.astComponentArray(match, "_", i) :
                    this.astComponent(match, "_", i);
            }

            for (var name in state.vars) {
                var match = state.vars[name];
                ret.vars[name] = _.isArray(match) ?
                    this.astComponentArray(match, "vars", name) :
                    this.astComponent(match, "vars", name);
            }

            return ret;
        }
    },

    addRule: function(rule, statics) {
        rule = Backbone.Views.extend(_.defaults(rule, this.defaults), statics);
        this.rules.push(rule);
        return rule;
    },

    parseProgram: function(code) {
        return new JSProgram({
            node: esprima.parse(code)
        });
    },

    parseStructure: function(fn) {
        return esprima.parse("(" + fn + ")").body[0].expression.body.body[0];
    }
};

var JSASTMixin = {
    toAST: function() {
        return Structured.injectData(this.props.structure, this.getAST());
    }
};

var JSProgram = JSRules.addRule({
    getType: function() {
        return "program";
    },

    genMatch: function() {
        return {
            _: [this.node.body]
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
}, {
    structure: {type: "Program"}
});

var JSVarAssignment = JSRules.addRule({
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
}, {
    structure: JSRules.parseStructure(function() {
        var _ = _;
    })
});

_.extend(JSVarAssignment.prototype, JSASTMixin);

var JSIdentifier = JSRules.addRule({
    events: {
        "change input": "onChange"
    },

    getType: function() {
        return "variable";
    },

    genMatch: function() {
        return {
            vars: {
                name: this.node.name
            }
        };
    },

    toAST: function() {
        return {
            type: "Identifier",
            name: this.match.vars.name
        };
    },

    onChange: function(event) {
        this.match.vars = {name: event.target.value};
    },

    render: function() {
        var name = this.match.vars.name;
        return <div className="block block-inline block-variable">
            <input type="text" defaultValue={name}
                size={name.toString().length}/>
        </div>;
    }
}, {
    structure: {type: "Identifier"}
});

var JSLiteral = JSRules.addRule({
    events: {
        "click": "activate",
        "change input": "onChange",
        "blur input": "onBlur",
        "keydown input": "onKeyDown"
    },

    getType: function() {
        return typeof this.node.value;
    },

    genMatch: function() {
        return {
            vars: {
                value: this.node.value
            }
        };
    },

    toAST: function() {
        return {
            type: "Literal",
            value: this.match.vars.value
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

        this.match.vars = {value: val};
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
        this.active = false;
    },

    activate: function() {
        this.active = true;
        var input = this.$el.find("input")[0];
        input.focus();
        input.select();
    },

    render: function() {
        var val = this.match.vars.value.toString();
        var className = "block block-inline block-" + this.getType();
        var activate = this.activate;

        if (!this.active || !this.editable) {
            if (!this.editable) {
                activate = null;
            }

            return <div className={className} onClick={activate}>
                <span className="value">{val}</span>
            </div>;
        }

        return <div className={className}>
            <input type="text"
                ref="input"
                defaultValue={this.node.value}
                size={val.toString().length}/>
        </div>;
    }
}, {
    structure: {type: "Literal"}
});