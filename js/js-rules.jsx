var JSRules = {
    rules: [],

    key: 0,

    addRule: function(rule) {
        rule = React.createClass(rule);
        this.rules.push(rule);
        return rule;
    },

    parseProgram: function(code) {
        var ast = esprima.parse(code);
        return this.findRule(ast);
    },

    findRule: function(node) {
        if (typeof node !== "object") {
            return;
        }

        for (var r = 0; r < this.rules.length; r++) {
            var rule = this.rules[r];
            var match = Structured.matchNode(node, rule.structure);

            if (match) {
                this.keys += 1;

                return React.createFactory(rule)({
                    node: match.root || node,
                    match: match,
                    key: this.key
                });
            }
        }

        throw new Error("No rule found for: " + JSON.stringify(node));
    },

    parseStructure: function(fn) {
        return esprima.parse("(" + fn + ")").body[0].expression.body.body[0];
    }
};

var JSMixin = {
    getInitialState: function() {
        var match = this.props.match;

        if (this.genMatch) {
            match = this.genMatch(match);
        }

        // Convert matched nodes into React components
        this.convertMatchToComponents(match);

        return {
            _: match._ || [],
            vars: match.vars || {}
        };
    },

    // TODO: Make this generic so that we can use this
    // recursion for other areas, as well.
    convertMatchToComponents: function(match) {
        if (match._) {
            for (var i = 0; i < match._.length; i++) {
                var singleMatch = match._[i];
                if (_.isArray(singleMatch)) {
                    this.handleMatchArray(singleMatch);
                } else {
                    this.handleMatch(singleMatch, match._, i);
                }
            }
        }

        if (match.vars) {
            for (var name in match.vars) {
                var singleMatch = match.vars[name];
                if (_.isArray(singleMatch)) {
                    this.handleMatchArray(singleMatch);
                } else {
                    this.handleMatch(singleMatch, match._, i);
                }
            }
        }
    },

    handleMatch: function(match, obj, name) {
        var rule = JSRules.findRule(match);
        if (rule) {
            obj[name] = JSRules.findRule(match);
        }
    },

    handleMatchArray: function(matches) {
        for (var i = 0; i < matches.length; i++) {
            this.handleMatch(matches[i], matches, i);
        }
    },

    toASTArray: function(array) {
        return array.map(function(node) {
            console.log(node)
            return node.toAST();
        });
    },

    toASTObject: function(object) {
        var vars = {};

        for (var key in this.state.vars) {
            vars[key] = this.state.vars[key].toAST();
        }

        return vars;
    },

    toScript: function() {
        return escodegen.generate(this.toAST());
    }
};

var JSASTMixin = {
    toAST: function() {
        // find all _/glob_ and $../glob$.. tokens and
        // recurse through and get the toAST of them, as well
        // Check if rule has a toAST() and call that instead
        return Structured.injectData(this.structure, {
            _: this.toASTArray(this.state._ || []),
            vars: this.toASTObject(this.state.vars || {})
        });
    }
};

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
            _: this.props.node.body
        };
    },

    toAST: function() {
        console.log("children", this.props.children)
        return {
            type: "Program",
            body: this.toASTArray(this.state._)
        };
    },

    render: function() {
        return <div className="program">
            <BlankStatements>{this.state._}</BlankStatements>
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
        return <div className="block block-statement">
            {'var '}{this.state._[0]}
            {' = '}<BlankInput>{this.state._[1]}</BlankInput>{';'}
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

    getInitialState: function() {
        return {
            name: this.props.node.name
        };
    },

    toAST: function() {
        return {
            type: "Identifier",
            name: this.state.name
        };
    },

    onChange: function(event) {
        this.setState({name: event.target.value});
    },

    render: function() {
        return <div className="block block-inline">
            <input type="text" defaultValue={this.state.name}
                onChange={this.onChange}/>
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

    getInitialState: function() {
        return {
            value: this.props.node.value
        };
    },

    toAST: function() {
        return {
            type: "Literal",
            name: this.state.value
        };
    },

    onChange: function(event) {
        this.setState({value: event.target.value});
    },

    render: function() {
        return <div className="block block-inline">
            <input type="text" defaultValue={this.state.value}
                onChange={this.onChange}/>
        </div>;
    }
});