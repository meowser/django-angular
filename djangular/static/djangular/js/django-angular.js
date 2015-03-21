// AUTOGENERATED FILE - DO NOT EDIT!
// django-angular - v0.7.11 - 2015-03-21
// https://github.com/jrief/django-angular
// Copyright (c) 2015 Jacob Rief; Licensed 
(function (angular, undefined) {
  'use strict';
  // module: ng.django.forms
  // Correct Angular's form.FormController behavior after rendering bound forms.
  // Additional validators for form elements.
  var djng_forms_module = angular.module('ng.django.forms', []);
  // create a simple hash code for the given string
  function hashCode(s) {
    return s.split('').reduce(function (a, b) {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
  }
  // This directive adds a dummy binding to input fields without attribute ng-model, so that AngularJS
  // form validation gets notified whenever the fields content changes.
  djng_forms_module.directive('input', [
    '$compile',
    function ($compile) {
      return {
        restrict: 'E',
        require: '?^form',
        link: function (scope, element, attr, formCtrl) {
          var modelName;
          if (!formCtrl || angular.isUndefined(formCtrl.$name) || element.prop('type') === 'hidden' || angular.isUndefined(attr.name) || angular.isDefined(attr.ngModel))
            return;
          modelName = 'dmy' + Math.abs(hashCode(formCtrl.$name)) + '.' + attr.name;
          attr.$set('ngModel', modelName);
          $compile(element, null, 9999)(scope);
        }
      };
    }
  ]);
  // Bound fields with invalid input data, shall be marked as ng-invalid-bound, so that
  // the input field visibly contains invalid data, even if pristine
  djng_forms_module.directive('djngError', function () {
    return {
      restrict: 'A',
      require: '?^form',
      link: function (scope, element, attrs, formCtrl) {
        var boundField;
        if (!formCtrl || angular.isUndefined(attrs.name) || attrs.djngError !== 'bound-field')
          return;
        boundField = formCtrl[attrs.name];
        boundField.$setValidity('bound', false);
        boundField.$parsers.push(function (value) {
          // set bound field into valid state after changing value
          boundField.$setValidity('bound', true);
          element.removeAttr('djng-error');
        });
      }
    };
  });
  // This directive overrides some of the internal behavior on forms if used together with AngularJS.
  // Otherwise, the content of bound forms is not displayed, because AngularJS does not know about
  // the concept of bound forms and thus hides values preset by Django while rendering HTML.
  djng_forms_module.directive('ngModel', function () {
    function restoreInputField(modelCtrl, field) {
      // restore the field's content from the rendered content of bound fields
      switch (field.type) {
      case 'radio':
        if (field.defaultChecked) {
          modelCtrl.$setViewValue(field.defaultValue);
        }
        break;
      case 'checkbox':
        if (field.defaultChecked) {
          modelCtrl.$setViewValue(true);
        }
        break;
      case 'password':
        // after an (un)successful submission, reset the password field
        modelCtrl.$setViewValue(null);
        break;
      default:
        if (field.defaultValue) {
          modelCtrl.$setViewValue(field.defaultValue);
        }
        break;
      }
    }
    function restoreSelectOptions(modelCtrl, field) {
      var multivalues = [];
      angular.forEach(field.options, function (option) {
        if (option.defaultSelected) {
          // restore the select option to selected
          angular.element(option).prop('selected', 'selected');
          if (field.multiple) {
            multivalues.push(option.value);
          } else {
            modelCtrl.$setViewValue(option.value);
          }
        }
      });
      if (field.multiple) {
        modelCtrl.$setViewValue(multivalues);
      }
    }
    function restoreTextArea(modelCtrl, field) {
      if (field.defaultValue) {
        // restore the field's content from the rendered content of bound fields
        modelCtrl.$setViewValue(field.defaultValue);
      }
    }
    return {
      restrict: 'A',
      priority: 1,
      require: [
        'ngModel',
        '^?form'
      ],
      link: function (scope, element, attrs, ctrls) {
        var field = angular.isElement(element) ? element[0] : null;
        var modelCtrl = ctrls[0], formCtrl = ctrls[1] || null;
        if (!field || !formCtrl)
          return;
        switch (field.tagName) {
        case 'INPUT':
          restoreInputField(modelCtrl, field);
          break;
        case 'SELECT':
          restoreSelectOptions(modelCtrl, field);
          break;
        case 'TEXTAREA':
          restoreTextArea(modelCtrl, field);
          break;
        default:
          console.log('Unknown field type');
          break;
        }
        // restore the form's pristine state
        formCtrl.$setPristine();
      }
    };
  });
  // This directive is added automatically by django-angular for widgets of type RadioSelect and
  // CheckboxSelectMultiple. This is necessary to adjust the behavior of a collection of input fields,
  // which forms a group for one `django.forms.Field`.
  djng_forms_module.directive('validateMultipleFields', function () {
    return {
      restrict: 'A',
      require: '^?form',
      link: function (scope, element, attrs, formCtrl) {
        var subFields, checkboxElems = [];
        function validate(event) {
          var valid = false;
          angular.forEach(checkboxElems, function (checkbox) {
            valid = valid || checkbox.checked;
          });
          formCtrl.$setValidity('required', valid);
          if (event) {
            formCtrl.$dirty = true;
            formCtrl.$pristine = false;
            scope.$apply();
          }
        }
        if (!formCtrl)
          return;
        try {
          subFields = angular.fromJson(attrs.validateMultipleFields);
        } catch (SyntaxError) {
          if (!angular.isString(attrs.validateMultipleFields))
            return;
          subFields = [attrs.validateMultipleFields];
          formCtrl = formCtrl[subFields];
        }
        angular.forEach(element.find('input'), function (elem) {
          if (subFields.indexOf(elem.name) >= 0) {
            checkboxElems.push(elem);
            angular.element(elem).on('change', validate);
          }
        });
        // remove "change" event handlers from each input field
        element.on('$destroy', function () {
          angular.forEach(element.find('input'), function (elem) {
            angular.element(elem).off('change');
          });
        });
        validate();
      }
    };
  });
  // This directive can be added to an input field which shall validate inserted dates, for example:
  // <input ng-model="a_date" type="text" validate-date="^(\d{4})-(\d{1,2})-(\d{1,2})$" />
  // Now, such an input field is only considered valid, if the date is a valid date and if it matches
  // against the given regular expression.
  djng_forms_module.directive('validateDate', function () {
    var validDatePattern = null;
    function validateDate(date) {
      var matched, dateobj;
      if (!date)
        // empty field are validated by the "required" validator
        return true;
      dateobj = new Date(date);
      if (isNaN(dateobj))
        return false;
      if (validDatePattern) {
        matched = validDatePattern.exec(date);
        return matched && parseInt(matched[2]) === dateobj.getMonth() + 1;
      }
      return true;
    }
    return {
      require: '?ngModel',
      restrict: 'A',
      link: function (scope, elem, attrs, controller) {
        if (!controller)
          return;
        if (attrs.validateDate) {
          // if a pattern is set, only valid dates with that pattern are accepted
          validDatePattern = new RegExp(attrs.validateDate, 'i');
        }
        var validator = function (value) {
          var validity = controller.$isEmpty(value) || validateDate(value);
          controller.$setValidity('date', validity);
          return validity ? value : undefined;
        };
        controller.$parsers.push(validator);
      }
    };
  });
  // If forms are validated using Ajax, the server shall return a dictionary of detected errors to the
  // client code. The success-handler of this Ajax call, now can set those error messages on their
  // prepared list-items. The simplest way, is to add this code snippet into the controllers function
  // which is responsible for submitting form data using Ajax:
  //  $http.post("/path/to/url", $scope.data).success(function(data) {
  //      djangoForm.setErrors($scope.form, data.errors);
  //  });
  // djangoForm.setErrors returns false, if no errors have been transferred.
  djng_forms_module.factory('djangoForm', function () {
    var NON_FIELD_ERRORS = '__all__';
    function isNotEmpty(obj) {
      for (var p in obj) {
        if (obj.hasOwnProperty(p))
          return true;
      }
      return false;
    }
    function resetFieldValidity(field) {
      var pos = field.$viewChangeListeners.push(field.clearRejected = function () {
          field.$message = '';
          field.$setValidity('rejected', true);
          field.$viewChangeListeners.splice(pos - 1, 1);
          delete field.clearRejected;
        });
    }
    function isField(field) {
      return angular.isArray(field.$viewChangeListeners);
    }
    return {
      setErrors: function (form, errors) {
        // remove errors from this form, which may have been rejected by an earlier validation
        form.$message = '';
        if (form.$error.hasOwnProperty('rejected') && angular.isArray(form.$error.rejected)) {
          /*
				 * make copy of rejected before we loop as calling
				 * field.$setValidity('rejected', true) modifies the error array
				 * so only every other one was being removed
				 */
          var rejected = form.$error.rejected.concat();
          angular.forEach(rejected, function (rejected) {
            var field, key = rejected.$name;
            if (form.hasOwnProperty(key)) {
              field = form[key];
              if (isField(field) && field.clearRejected) {
                field.clearRejected();
              } else {
                field.$message = '';
                // this field is a composite of input elements
                angular.forEach(field, function (subField, subKey) {
                  if (subField && isField(subField) && subField.clearRejected) {
                    subField.clearRejected();
                  }
                });
              }
            }
          });
        }
        // add the new upstream errors
        angular.forEach(errors, function (errors, key) {
          var field;
          if (errors.length > 0) {
            if (key === NON_FIELD_ERRORS) {
              form.$message = errors[0];
              form.$setPristine();
            } else if (form.hasOwnProperty(key)) {
              field = form[key];
              field.$message = errors[0];
              field.$setValidity('rejected', false);
              field.$setPristine();
              if (isField(field)) {
                resetFieldValidity(field);
              } else {
                // this field is a composite of input elements
                angular.forEach(field, function (subField, subKey) {
                  if (subField && isField(subField)) {
                    resetFieldValidity(subField);
                  }
                });
              }
            }
          }
        });
        return isNotEmpty(errors);
      }
    };
  });
  // This directive behaves similar to `ng-bind` but leaves the elements content as is, if the
  // value to bind is undefined. This allows to set a default value in case the scope variables
  // are not ready yet.
  djng_forms_module.directive('djngBindIf', function () {
    return {
      restrict: 'A',
      compile: function (templateElement) {
        templateElement.addClass('ng-binding');
        return function (scope, element, attr) {
          element.data('$binding', attr.ngBind);
          scope.$watch(attr.djngBindIf, function ngBindWatchAction(value) {
            // We are purposefully using == here rather than === because we want to
            // catch when value is "null or undefined"
            // jshint -W041
            if (value == undefined)
              return;
            element.text(value);
          });
        };
      }
    };
  });
}(window.angular));
(function (angular, undefined) {
  'use strict';
  // module: ng.django.rmi
  var djng_rmi_module = angular.module('ng.django.rmi', []);
  // A simple wrapper to extend the $httpProvider for executing remote methods on the server side
  // for Django Views derived from JSONResponseMixin.
  // It can be used to invoke GET and POST requests. The return value is the same promise as returned
  // by $http.get() and $http.post().
  // Usage:
  // djangoRMI.name.method(data).success(...).error(...)
  // @param data (optional): If set and @allowd_action was auto, then the call is performed as method
  //     POST. If data is unset, method GET is used. data must be a valid JavaScript object or undefined.
  djng_rmi_module.provider('djangoRMI', function () {
    var remote_methods, http;
    this.configure = function (conf) {
      remote_methods = conf;
      convert_configuration(remote_methods);
    };
    function convert_configuration(obj) {
      angular.forEach(obj, function (val, key) {
        if (!angular.isObject(val))
          throw new Error('djangoRMI.configure got invalid data');
        if (val.hasOwnProperty('url')) {
          // convert config object into function
          val.headers['X-Requested-With'] = 'XMLHttpRequest';
          obj[key] = function (data) {
            var config = angular.copy(val);
            if (config.method === 'POST') {
              if (data === undefined)
                throw new Error('Calling remote method ' + key + ' without data object');
              config.data = data;
            } else if (config.method === 'auto') {
              if (data === undefined) {
                config.method = 'GET';
              } else {
                // TODO: distinguish between POST and PUT
                config.method = 'POST';
                config.data = data;
              }
            }
            return http(config);
          };
        } else {
          // continue to examine the values recursively
          convert_configuration(val);
        }
      });
    }
    this.$get = [
      '$http',
      function ($http) {
        http = $http;
        return remote_methods;
      }
    ];
  });
}(window.angular));
(function (angular, undefined) {
  'use strict';
  /*
     module: ng.django.urls
     Provide url reverse resolution functionality for django urls in angular
     Usage: djangoUrl.reverse(url_name, args_or_kwargs)

     Examples:
        - djangoUrl.reverse('home', [user_id: 2]);
        - djangoUrl.reverse('home', [2]);
     */
  var djngUrls = angular.module('ng.django.urls', []);
  var reverseUrl = '/angular/reverse/';
  djngUrls.service('djangoUrl', function () {
    /*
         Functions from angular.js source, not public available
         See: https://github.com/angular/angular.js/issues/7429
         */
    function forEachSorted(obj, iterator, context) {
      var keys = sortedKeys(obj);
      for (var i = 0; i < keys.length; i++) {
        iterator.call(context, obj[keys[i]], keys[i]);
      }
      return keys;
    }
    function sortedKeys(obj) {
      var keys = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      return keys.sort();
    }
    function buildUrl(url, params) {
      if (!params)
        return url;
      var parts = [];
      forEachSorted(params, function (value, key) {
        if (value == null || value == undefined)
          return;
        if (angular.isObject(value)) {
          value = angular.toJson(value);
        }
        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      });
      return url + (url.indexOf('?') == -1 ? '?' : '&') + parts.join('&');
    }
    // Service public interface
    this.reverse = function (url_name, args_or_kwargs) {
      var url = buildUrl(reverseUrl, { djng_url_name: url_name });
      /*
             Django wants arrays in query params encoded the following way: a = [1,2,3] -> ?a=1&a=2$a=3
             buildUrl function doesn't natively understand lists in params, so in case of a argument array
             it's called iteratively, adding a single parameter with each call

             url = buildUrl(url, {a:1}) -> returns /url?a=1
             url = buildUrl(url, {a:2}) -> returns /url?a=1&a=2
             ...
             */
      if (Array.isArray(args_or_kwargs)) {
        forEachSorted(args_or_kwargs, function (value) {
          url = buildUrl(url, { 'djng_url_args': value });
        });
        return url;
      }
      /*
             If there's a object of keyword arguments, a 'djng_url_kwarg_' prefix is prepended to each member
             Then we can directly call the buildUrl function
             */
      var params = {};
      forEachSorted(args_or_kwargs, function (value, key) {
        params['djng_url_kwarg_' + key] = value;
      });
      /*
            If params is empty (no kwargs passed) return url immediately
            Calling buildUrl with empty params object adds & or ? at the end of query string
            E.g. buldUrl('/url/djng_url_name=home', {}) -> /url/djng_url_name=home&
             */
      if (angular.equals(params, {})) {
        // If params is empty, no kwargs passed.
        return url;
      }
      return buildUrl(url, params);
    };
  });
}(window.angular));
(function (angular, undefined) {
  'use strict';
  function noop() {
  }
  // Add three-way data-binding for AngularJS with Django using websockets.
  var djng_ws_module = angular.module('ng.django.websocket', []);
  // Wraps the built-in WebSocket into a replaceable provider suitable for dependency injection.
  djng_ws_module.service('$websocket', function () {
    var ws;
    this.connect = function (url) {
      ws = new WebSocket(url);
      ws.onopen = this.onopen;
      ws.onmessage = this.onmessage;
      ws.onerror = this.onerror;
      ws.onclose = this.onclose;
    };
    this.send = function (msg) {
      ws.send(msg);
    };
    this.close = function () {
      ws.close();
    };
  });
  djng_ws_module.provider('djangoWebsocket', function () {
    var _console = {
        log: noop,
        warn: noop,
        error: noop
      };
    var websocket_uri, heartbeat_msg = null;
    // Set prefix for the Websocket's URI.
    // This URI must be set during initialization using
    // djangoWebsocketProvider.setURI('{{ WEBSOCKET_URI }}');
    this.setURI = function (uri) {
      websocket_uri = uri;
      return this;
    };
    // Set the heartbeat message and activate the heartbeat interval to 5 seconds.
    // The heartbeat message shall be configured using
    // djangoWebsocketProvider.setHeartbeat({{ WS4REDIS_HEARTBEAT }});  // unquoted!
    // The default behavior is to not listen on heartbeats.
    this.setHeartbeat = function (msg) {
      heartbeat_msg = msg;
      return this;
    };
    this.setLogLevel = function (logLevel) {
      switch (logLevel) {
      case 'debug':
        _console = console;
        break;
      case 'log':
        _console.log = console.log;
      /* falls through */
      case 'warn':
        _console.warn = console.warn;
      /* falls through */
      case 'error':
        _console.error = console.error;
      /* falls through */
      default:
        break;
      }
      return this;
    };
    this.$get = [
      '$websocket',
      '$q',
      '$timeout',
      '$interval',
      function ($websocket, $q, $timeout, $interval) {
        var ws_url, deferred, scope, collection;
        var is_subscriber = false, is_publisher = false, receiving = false;
        var wait_for_reconnect = 0, heartbeat_promise = null, missed_heartbeats = 0;
        function connect() {
          _console.log('Connecting to ' + ws_url);
          deferred = $q.defer();
          $websocket.connect(ws_url);
        }
        $websocket.onopen = function (evt) {
          _console.log('Connected');
          deferred.resolve();
          wait_for_reconnect = 0;
          if (heartbeat_msg && heartbeat_promise === null) {
            missed_heartbeats = 0;
            heartbeat_promise = $interval(sendHeartbeat, 5000);
          }
        };
        $websocket.onclose = function (evt) {
          _console.log('Disconnected');
          deferred.reject();
          wait_for_reconnect = Math.min(wait_for_reconnect + 1000, 10000);
          $timeout(function () {
            $websocket.connect(ws_url);
          }, wait_for_reconnect);
        };
        $websocket.onerror = function (evt) {
          _console.error('Websocket connection is broken!');
          $websocket.close();
        };
        $websocket.onmessage = function (evt) {
          var data;
          if (evt.data === heartbeat_msg) {
            // reset the counter for missed heartbeats
            missed_heartbeats = 0;
            return;
          }
          try {
            data = angular.fromJson(evt.data);
          } catch (e) {
            _console.warn('Data received by server is invalid JSON: ' + evt.data);
            return;
          }
          if (is_subscriber) {
            // temporarily disable the function 'listener', so that message received
            // from the websocket, are not propagated back
            receiving = true;
            scope.$apply(function () {
              angular.extend(scope[collection], data);
            });
            receiving = false;
          }
        };
        function sendHeartbeat() {
          try {
            missed_heartbeats++;
            if (missed_heartbeats > 3)
              throw new Error('Too many missed heartbeats.');
            $websocket.send(heartbeat_msg);
          } catch (e) {
            $interval.cancel(heartbeat_promise);
            heartbeat_promise = null;
            _console.warn('Closing connection. Reason: ' + e.message);
            $websocket.close();
          }
        }
        function listener(newValue, oldValue) {
          if (!receiving && !angular.equals(oldValue, newValue)) {
            $websocket.send(angular.toJson(newValue));
          }
        }
        function setChannels(channels) {
          angular.forEach(channels, function (channel) {
            if (channel.substring(0, 9) === 'subscribe') {
              is_subscriber = true;
            } else if (channel.substring(0, 7) === 'publish') {
              is_publisher = true;
            }
          });
        }
        function watchCollection() {
          scope.$watchCollection(collection, listener);
        }
        function buildWebsocketURL(facility, channels) {
          var parts = [
              websocket_uri,
              facility,
              '?'
            ];
          parts.push(channels.join('&'));
          ws_url = parts.join('');
        }
        return {
          connect: function ($scope, scope_obj, facility, channels) {
            scope = $scope;
            setChannels(channels);
            collection = scope_obj;
            scope[collection] = scope[collection] || {};
            buildWebsocketURL(facility, channels);
            connect();
            if (is_publisher) {
              deferred.promise.then(watchCollection);
            }
            return deferred.promise;
          }
        };
      }
    ];
  });
}(window.angular));