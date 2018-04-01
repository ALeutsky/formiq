/**
 * formiQ - library to work with forms
 * @author Alexander Leutsky
 * @license MIT
 */

(function (root) {
    var globalSettings = {
        validator: undefined,
        errors: {},
        ignore: [],
        errorMessages: {},
        converterAttribute: "data-conv",
        converters: {
            number: function (val) {
                return (val === "") ? null : +val;
            }
        }
    };

    /**
     * @alias formiQ
     * @constructor
     * @expose
     * @param {string|jQuery|HTMLFormElement} selector
     * @param {object} options
     */
    var formiQ = function (selector, options) {
        if (!(this instanceof formiQ)) {
            return new formiQ(selector);
        }

        var form,
            settings = this.settings = extend({}, globalSettings, options);

        if (typeof selector == "string") {
            form = root.document.querySelector(selector);
        } else if (selector instanceof HTMLFormElement) {
            form = selector;
        } else if (root.jQuery && selector instanceof root.jQuery && selector.length) {
            form = selector[0];
        }

        if (!(form instanceof HTMLFormElement)) {
            throw "Form not found"
        }

        this.form = form;


    }

    /**
     *
     * @param options
     */
    formiQ.configure = function (options) {
        if (this instanceof formiQ) {
            extend(this.settings, options);
            /*
            if (typeof this.settings.highlight == "function") {
                this.highlight = this.settings.highlight;
                delete this.settings.highlight;
            }

            if (typeof this.settings.unhighlight == "function") {
                this.unhighlight = this.settings.unhighlight;
                delete this.settings.unhighlight;
            }
            */
        } else {
            extend(globalSettings, options);
        }
    }

    /**
     *
     * @type {Function}
     */
    formiQ.prototype.configure = formiQ.configure;

    /**
     * @expose
     * @return {Object}
     */
    formiQ.prototype.getValue = function () {
        var i, field, type, name, value,
            result = {},
            fields = this.form.elements,
            convAttr = this.settings.converterAttribute,
            converter,
            converters = this.settings.converters || {};

        for (i = 0; i < fields.length; i++) {
            field = fields[i];

            type = getType(field);
            name = getName(field);

            if (!name) continue;

            if (type == "radio" || type == "checkbox") {
                if (isChecked(field)) {
                    value = field.value;
                } else {
                    continue;
                }
            } else {
                value = field.value;
            }

            if (field.hasAttribute(convAttr)) {
                converter = field.getAttribute(convAttr);
                if (typeof converters[converter] == "function") {
                    value = converters[converter](value);
                }
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

    formiQ.prototype.eachField = function (func) {
        var i,
            fields = this.form.elements;

        for (i = 0; i < fields.length; i++) {
            func.call(this, fields[i], getName(fields[i]), i);
        }
    }

    formiQ.prototype.validate = function () {
        var i, field, fieldName,
            errors = [],
            fields = this.form.elements,
            values = this.getValue();

        this._errors = undefined;

        for (i = 0; i < fields.length; i++) {
            field = fields[i];
            fieldName = getName(field);

            // required
            if (field.required && (!(fieldName in values && values[fieldName]))) {
                errors.push({
                    fieldName: fieldName,
                    type: "required",
                    message: this.getErrorMessage(fieldName, "required")
                });
            }

            // by field type

        }

        if (errors.length > 0) {
            this._errors = errors;
        }
    };


    formiQ.prototype.getErrorMessage = function (fieldName, errorType) {
        var errorMessages = this.settings.errorMessages;

        if (errorMessages) {
            if (fieldName in errorMessages && errorType in errorMessages[fieldName]) {
                return errorMessages[fieldName][errorType];
            }
        }

        return "";
    };


    /**
     * @expose
     * @return {boolean}
     */
    formiQ.prototype.isValid = function () {
        this.validate();

        return !this._errors;
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

    /**
     * On invalid field
     * @param field
     * @param fieldName
     * @param validationError
     */
    //formiQ.prototype.onInvalidField = function (field, fieldName, validationError) {}

    /**
     * On valid field
     * @param field
     * @param fieldName
     */
    //formiQ.prototype.onValidField = function (field, fieldName) {}


    /**
     * On reset field
     * @param field
     * @param fieldName
     */
    //formiQ.prototype.onResetField = function (field, fieldName) {}


    function isFunction (obj) {
        return typeof obj === "function";
    }

    function isChecked (el) {
        return el.checked;
    }

    function extend (source) {
        var i, k, dict;
        for (i = 1; i < arguments.length; i++) {
            dict = arguments[i];

            if (dict && typeof dict == "object") {
                for (k in dict) {
                    source[k] = dict[k];
                }
            }

        }

        return source;
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

    if (typeof module !== 'undefined' && typeof exports !== 'undefined' && module.exports == exports) {
        exports = module.exports = formiQ;
    } else {
        root.formiQ = formiQ;
    }

}) (this);
