/*
var JSMixin = {
    getInitialState: function() {
        var match = this.props.match;

        if (this.genMatch) {
            match = this.genMatch(match);
        }

        match._ = match._ || [];
        match.vars = match.vars || {};

        return match;
    },

    getChildComponents: function(state) {
        state = state || this.state;
        var ret = {_: [], vars: {}};

        for (var i = 0; i < state._.length; i++) {
            var match = state._[i];
            ret._[i] = _.isArray(match) ?
                this.componentMatchArray(match, "_", i) :
                this.componentMatch(match, "_", i);
        }

        for (var name in state.vars) {
            var match = state.vars[name];
            ret.vars[name] = _.isArray(match) ?
                this.componentMatchArray(match, "vars", name) :
                this.componentMatch(match, "vars", name);
        }

        return ret;
    },

    componentMatch: function(match, ns, id) {
        return <JSRule ref={ns + id} data={match}
            editable={this.props.editable}/>;
    },

    componentMatchArray: function(matches, ns, id) {
        return matches.map(function(match, i) {
            return this.componentMatch(match, ns, id + "-" + i);
        }.bind(this));
    },

    getAST: function() {
        var state = this.state;
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
    },

    astComponent: function(match, ns, id) {
        return this.refs[ns + id].toAST();
    },

    astComponentArray: function(matches, ns, id) {
        return matches.map(function(match, i) {
            return this.astComponent(match, ns, id + "-" + i);
        }.bind(this));
    }
};



var JSRule = React.createClass({
    toAST: function() {
        return this.refs.child.toAST();
    },

    toScript: function() {
        return escodegen.generate(this.toAST());
    },

    render: function() {
        var node = this.props.data;

        if (typeof node !== "object") {
            return;
        }

        for (var r = 0; r < JSRules.rules.length; r++) {
            var rule = JSRules.rules[r];
            var match = Structured.matchNode(node, rule.structure);

            if (match) {
                return React.createFactory(rule)({
                    node: node,
                    match: match,
                    structure: rule.structure,
                    ref: "child",
                    draggable: true,
                    editable: this.props.editable
                });
            }
        }

        throw new Error("No rule found for: " + JSON.stringify(node));
    }
});
*/