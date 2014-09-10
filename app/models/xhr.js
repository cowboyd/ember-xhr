import Ember from 'ember';

var ProgressEventTarget = Ember.Mixin.create(Ember.PromiseProxyMixin, {
  isAborted: false,
  isErrored: false,
  isLoaded: false,
  isLoadStarted: false,
  isTimedOut: false,
  isLoadEnded: false,

  promise: Ember.computed.readOnly('deferred.promise'),
  deferred: Ember.computed(function() {
    return Ember.RSVP.defer();
  }).readOnly(),
  target: Ember.required(),
  _setupProgressEventListeners: Ember.observer(function() {
    var object = this;
    var target = this.get('target');
    var deferred = this.get('deferred');
    target.onabort = function() {
      object.set('isAborted', true);
      deferred.reject('aborted');
    };
    target.onerror = function() {
      object.set('isErrored', true);
      deferred.reject('aborted');
    };
    target.onload = function() {
      object.set('isLoaded', true);
      deferred.resolve(target);
    };
    target.onloadstart = function() {
      object.set('loadStartedAt', new Date());
      object.set('isLoadStarted', true);
    };
    target.ontimeout = function() {
      object.set('isTimedOut', true);
      deferred.reject('timeout');
    };
    target.onloadend = function() {
      object.set('loadEndedAt', new Date());
      object.set('isLoadEnded', true);
    };
    target.onprogress = function(event) {
      object.set('progress', ProgressEvent.create({event: event}));
    };
  }).on('init')
});

var ProgressEvent = Ember.Object.extend({
  event: null,
  lengthComputable: Ember.computed.readOnly('event.lengthComputable'),
  loaded: Ember.computed.readOnly('event.loaded'),
  total: Ember.computed.readOnly('event.total'),
  ratio: Ember.computed('lengthComputable', 'loaded', 'total', function() {
    if (this.get('lengthComputable')) {
      return this.get('loaded') / this.get('total');
    } else {
      return NaN;
    }
  })
});

var XHR = Ember.Object.extend(ProgressEventTarget, {
  open: function(method, url) {
    this.get('target').open(method, url);
  },
  send: function() {
    var target = this.get('target');
    target.send.apply(target, arguments);
  },
  abort: function() {
    this.get('target').abort();
  },
  target: Ember.computed(function() {
    return new XMLHttpRequest();
  }).readOnly(),
  readyStateBinding: Ember.Binding.oneWay('state.readyState'),
  responseTypeBinding: Ember.Binding.oneWay('state.responseType'),
  responseBinding: Ember.Binding.oneWay('state.response'),
  responseTextBinding: Ember.Binding.oneWay('state.responseText'),
  responseXMLBinding: Ember.Binding.oneWay('state.responseXML'),

  timeout: Ember.computed.alias('target.timeout'),
  upload: Ember.computed(function() {
    return Upload.create({
      target: this.get('target.upload')
    });
  }).readOnly(),
  state: Ember.computed(function() {
    return UnsentState.create({
      request: this.get('request')
    });
  }),
  listenForReadyStateChanges: Ember.observer(function() {
    var object = this
    var target = this.get('target');
    target.onreadystatechange = function() {
      var State = READY_STATES[target.readyState];
      object.set('state', State.create({request: target}));
    };
  }).on('init')
});


var Upload = Ember.Object.extend(ProgressEventTarget);

var ReadyState = Ember.Object.extend({
  readyState: Ember.computed.readOnly('request.readyState'),
  responseType: Ember.computed.readOnly('request.responseType'),
  response: Ember.computed.readOnly('request.response'),
  responseText: Ember.computed.readOnly('request.responseText'),
  responseXML: Ember.computed.readOnly('request.responseXML')
});

var UnsentState = ReadyState.extend({
  value: 0,
  name: 'UNSENT',
  description: 'open() has not been called yet.'
});

var OpenedState = ReadyState.extend({
  value: 1,
  name: 'OPENED',
  description: 'send() has not been called yet.'
});

var HeadersReceivedState = ReadyState.extend({
  value: 2,
  name: 'HEADERS_RECEIVED',
  description: 'send() has been called, and headers and status are available.'
});

var LoadingState = ReadyState.extend({
  value: 3,
  name: 'LOADING',
  description: 'Downloading; responseText holds partial data.'
});

var DoneState = ReadyState.extend({
  value: 4,
  name: 'DONE',
  description: 'The operation is complete.'
});

var READY_STATES = [UnsentState, OpenedState, HeadersReceivedState, LoadingState, DoneState];

export default XHR;
