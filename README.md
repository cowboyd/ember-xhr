# ember-xhr

Easily achieve beautiful, transparent uploads and downloads with a reactive XmlHttpRequest

## Why?

The standard XmlHttpReuest object that is part of the standard browser
toolkit provides an imperative / callback based API, and so reacting
to changes can be a frustrating exercise in "what callbacks do I
register? onloadend? onload?", "In what order are they fired?", "what
are the properties of the event", etc...

`Ember.XHR` is a drop-in replacement for the native browser
XMLHttpRequest whose properties are fully reactive, and so integrating
it into your UI is a breeze. There are no need to register *any*
callbacks since all of its properties can be observed, bound to, or
computed from.

All of the properties of the the XHR, including `readyState`,
`status`, `response`, `responseText`, `progress`, etc... are reactive
and can be bound to in templates, and can also be used as the input
for other computed properties.

This is particularly useful in tracking the progress of an upload or a
download.

## What is Progress?

There are progress properties that correspond to the state of the
upload and the download, and that react as that state changes. The
download progress properties are the `progress`
property. E.g. `progress.total`, while the upload progress is on the
`upload.progress` property. E.g. `upload.progress.total`

These reactive properties are:


* **total**: the total number of bytes that will be sent in this transfer.
* **loaded**: how many bytes of the total have been transferred thus far.
* **percentage**: what percentage of the total bytes have been transferred thus far.
* **totalTime**: time in milliseconds that this transfer has been in progress.
* **averageSpeed**: Over the coures of the transfer, the average speed in bytes per second.

Because Ember.XHR radiates all information about its progress,
building UIs to track it are a snap.

## Installation

Ember XHR can be used via ember-cli, or from a global build. The choice is yours, but to use the global build, you'll have to jump through a few more hoops.

### Ember CLI

Using it with ember-cli is a snap:

    npm install --save ember-xhr

Then, anywhere in your app:

```js
import XHR from 'ember-xhr';
```

### Global Build

```
git clone git://github.com/cowboyd/ember-xhr.git
cd ember-xhr
npm install
ember build
```

This will build `dist/ember-xhr.js` and `dist/ember-xhr.js.map` which you can place into your `vendor/` directory or wherever it is you keep your javascript files. This will define `Ember.XHR`, so anywhere in your app, you can say:

```js
var XHR = Ember.XHR;
```


## Example

```js
var file = getDraggedFile();
var xhr = XHR.create();
xhr.open('PUT', '/path/to/some/blob', true);
xhr.setRequestHeader('Content-Type', 'application/octet-stream');
xhr.send(file);
this.set('xhr', xhr);
```

The xhr can just be dropped into a template.

```hbs
{{xhr.readyState}}
Bytes Uploaded: {{xhr.upload.progress.loaded}}
Bytes Downloaded: {{xhr.progress.loaded}}
Avg. Upload Speed (bytes/second): {{xhr.upload.progress.averageSpeed}}
Avg. Download Speed (bytes/second): {{xhr.progress.averageSpeed}}
Percentage Uploaded: {{xhr.upload.progress.percentage}} {{!=> .45}}
Percentage Downloaded: {{xhr.progress.percentage}}
```

It's not just for templates though... binding the upload percentage to
the width of a progress bar is another simple application.

## And that's a promise!

As a kicker, every instance of `Ember.XHR` implements the promise
interface.

```js
xhr.then(function(response) {
  console.log('response', response);
})
```
