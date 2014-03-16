/**
 * formiQ - library to work with forms
 * @author Alexander Leutsky
 * @license MIT
 */

(function (window, document) {
    var settings = {
        validatorAttr: "data-validator",
        validator: window["validiQ"]
    }

    /**
     * @alias formiQ
     * @constructor
     * @expose
     * @param {string|jQuery|HTMLFormElement} selector
     */
    var formiQ = function (selector) {
        if (!(this instanceof formiQ)) {
            return new formiQ(selector);
        }

        var form;

        if (typeof selector == "string") {
            form = document.querySelector(selector);
        } else if (selector instanceof HTMLFormElement) {
            form = selector;
        } else if (window.jQuery && selector instanceof window.jQuery && selector.length) {
            form = selector[0];
        }

        if (!(form instanceof HTMLFormElement)) {
            throw "Form not found"
        }

        this.form = form;
    }

    /**
     * @expose
     * @return {Object}
     */
    formiQ.prototype.getValue = function () {
        var i, field, type, name, value,
            result = {},
            fields = this.form.elements;

        for (i = 0; i < fields.length; i++) {
            field = fields[i];

            type = getType(field);
            name = getName(field);

            if (type == "radio" || type == "checkbox") {
                if (isChecked(field)) {
                    value = field.value;
                } else {
                    continue;
                }
            } else {
                value = field.value;
            }

            if (name in result) {
                if (!(result[name] instanceof Array)) {
                    result[name] = [result[name]];
                }
                result[name].push(value);
            } else {
                result[name] = value;
            }
        }

        return result;
    }

    /**
     * @expose
     * @param {string|Object} name
     * @param value
     */
    formiQ.prototype.setValue = function (name, value) {
        var values;

        if (typeof name == "string") {
            values = {};
            values[name] = value;
        } else {
            values = name;
        }

        var i, j, field, type,
            fieldPos = {},
            fields = this.form.elements;

        for (i = 0; i < fields.length; i++) {
            field = fields[i];
            name = getName(field);

            if (name in values) {
                type = getType(field);
                value = values[name];

                if (type == "radio" || type == "checkbox") {
                    if (value instanceof Array) {
                        field.checked = false;
                        for (j = 0; j < value.length; j++) {
                            if (field.value == value[j]) {
                                field.checked = true;
                                break;
                            }
                        }
                    } else {
                        field.checked = (field.value == value);
                    }
                } else {
                    if (value instanceof Array) {
                        if (!(name in fieldPos)) {
                            fieldPos[name] = 0;
                        } else {
                            fieldPos[name]++;
                        }

                        field.value = value[fieldPos[name]];
                    } else {
                        field.value = value;
                    }
                }
            }
        }
    }

    /**
     * @expose
     * @return {boolean}
     */
    formiQ.prototype.isValid = function () {
        var i, field,
            errors = [],
            fields = this.form.elements;

        if (settings.validator) {
            for (i = 0; i < fields.length; i++) {
                field = fields[i];

                if (!isValid(field)) {
                    errors.push(getName(field));
                }
            }

            if (errors.length == 0) {
                this._errors = undefined;
            } else {
                this._errors = errors;
                return false;
            }
        }

        return true
    }

    /**
     * @expose
     * @return {Object|undefined}
     */
    formiQ.prototype.errors = function () {
        return this._errors;
    }

    /**
     * Submit form
     * @expose
     */
    formiQ.prototype.submit = function () {
        this.form.submit();
    }

    /**
     * Reset form
     * @expose
     */
    formiQ.prototype.reset = function () {
        this.form.reset();
    }

    /**
     * Destroy formiQ object
     * @expose
     */
    formiQ.prototype.destroy = function () {
        this.form = undefined;
    }

    function isChecked (el) {
        return el.checked;
    }

    function isValid (el) {
        var vquery = el.getAttribute(settings.validatorAttr);

        if (vquery) {
            return settings.validator(vquery)(getValue(el));
        } else {
            return true;
        }
    }

    function getType (el) {
        var tagName = el.tagName.toLowerCase();
        return (tagName == "input") ? el.type.toLowerCase() : tagName;
    }

    function getName (el) {
        return el.name;
    }

    function getValue (el) {
        var type = getType(el);

        if (type == "radio" || type == "checkbox") {
            return isChecked(el) ? el.value : undefined;
        } else {
            return el.value;
        }
    }

    window.formiQ = formiQ;
}) (window, document);
