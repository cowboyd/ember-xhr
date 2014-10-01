import Ember from 'ember';

var ProgressEventTarget = Ember.Mixin.create(Ember.PromiseProxyMixin, {
  isAborted: false,
  isErrored: false,
  isLoaded: false,
  isLoadStarted: false,
  isTimedOut: false,
  isLoadEnded: false,


  deferred: Ember.computed(function() {
    var deferred = Ember.RSVP.defer();
    this.set('promise', deferred.promise);
    return deferred;
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
      deferred.reject('error');
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
      object.set('progress', Progress.create({
        target: object,
        event: event,
        at: new Date()
      }));
    };
  }).on('init')
});

var Progress = Ember.Object.extend({
  target: null,
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
  }),
  percentage: Ember.computed('ratio', function() {
    var ratio = this.get('ratio');
    if (!!ratio) {
      return Math.round(ratio * 100);
    } else {
      return NaN;
    }
  }),
  averageSpeed: Ember.computed('loaded', 'totalTime', function() {
    var durationMillis = this.get('totalTime');
    var durationSeconds = Math.round(durationMillis / 1000);
    return this.get('loaded') / durationSeconds;
  }),
  totalTime: Ember.computed('target.loadStartedAt', 'at', function() {
    return this.get('at').getTime() - this.get('target.loadStartedAt').getTime();
  })
});

function delegateToXHR(method) {
  return function() {
    var target = this.get('target');
    return target[method].apply(target, arguments);
  };
}

var XHR = Ember.Object.extend(ProgressEventTarget, {
  target: Ember.computed(function() {
    return new XMLHttpRequest();
  }).readOnly(),

  open: delegateToXHR('open'),
  abort: delegateToXHR('abort'),
  send: function() {
    //materialize uploads
    this.get('upload');
    return delegateToXHR("send").apply(this, arguments);
  },
  setRequestHeader: delegateToXHR('setRequestHeader'),
  getResponseHeader: delegateToXHR('getResponseHeader'),
  overrideMimeType: delegateToXHR('overrideMimeType'),

  statusBinding: Ember.Binding.oneWay('state.status'),
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
    var object = this;
    var target = this.get('target');
    target.onreadystatechange = function() {
      var State = READY_STATES[target.readyState];
      object.set('state', State.create({request: target}));
    };
  }).on('init')
});


var Upload = Ember.Object.extend(ProgressEventTarget);

var ReadyState = Ember.Object.extend({
  status: Ember.computed.readOnly('request.status'),
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

Ember.XHR = XHR;

export default XHR;
