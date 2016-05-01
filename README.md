[![npm version](https://badge.fury.io/js/markdown-doctest.svg)](http://badge.fury.io/js/markdown-doctest)
[![Build Status](https://travis-ci.org/Widdershin/markdown-doctest.svg?branch=master)](https://travis-ci.org/Widdershin/markdown-doctest)

* * *

# markdown-doctest
Test all the code in your markdown docs!

Why on earth?
---

As an open source developer, there are few things more embarassing than a user opening an issue to inform you that your README example is broken! With  `markdown-doctest`, you can rest easy knowing that your example code is *actually runnable*.

Installation
---
Just `npm install markdown-doctest` and run `markdown-doctest`. It will run all of the Javascript code examples tucked away in your markdown, and let you know if any blow up.

Okay, how do I use it?
---

Let's try it on this repo!

```js
var a = 5;

var b = 10;

console.log(a + c);
```

There's a problem with that example. `markdown-doctest` finds it for us:

```bash
$ markdown-doctest
Failed - README.md:27:17
ReferenceError: c is not defined

1/2 passing
```

Awesome! No excuse for broken documentation ever again, right? :wink:

We can also run specific files or folders by running `markdown-doctest` with a glob, like `markdown-doctest docs/**/*.md`. By default `markdown-doctest` will recursively run all the `.md` or `.markdown` files starting with the current directory, with the exception of the `node_modules` directory.

Note: `markdown-doctest` doesn't actually attempt to provide any guarantee that your code worked, only that it didn't explode in a horrible fashion. If you would like to use `markdown-doctest` for actually testing the correctness of your code, you can add some `assert`s to your examples.

`markdown-doctest` is not a replacement for your test suite. It's designed to run with your CI build and give you peace of mind that all of your examples are at least vaguely runnable.

So how do I write those examples?
---

In your markdown files, anything inside of code blocks with 'js' or 'es6' will be run. E.g:

    ```js
    console.log("Yay, tests in my docs");
    ```

    ```es6
    const a = 5;
    console.log({a, foo: 'test'});
    ```

I have a code example I don't want tested!
---
You can tell `markdown-doctest` to skip examples by adding `<!-- skip-example -->` before the example. E.g:

    <!-- skip-example -->
    ```js
    // not a runnable example

    var foo = download(...);
    ```

How do requires work? And other setup logic?
---

You can `require` any needed modules or example helpers in `.markdown-doctest-setup.js`. E.g:

<!-- skip-example -->
```js
// .markdown-doctest-setup.js
module.exports = {
  require: {
    Rx: require('rx')
  },

  globals: {
    $: require('jquery')
  }
}
```

Anything exported under `require` will then be used by any examples that `require` that key.
You must explicitly configure all of the dependencies used in your examples.

Anything exported under `globals` will be available globally across all examples.

You can also specify a regexRequire section to handle anything more complex than an exact string match!

<!-- skip-example -->
```js
// .markdown-doctest-setup.js
module.exports = {
  require: {
    Rx: require('rx')
  },

  regexRequire: {
    'rx/(.*)': function (fullPath, matchedModuleName) {
      return require('./dist/' + matchedModuleName);
    }
  }
}
```

Do I have to enable es6 support?
---

Nope, ES6 support is on by default. You can configure babel in your `.markdown-doctest-setup.js`

<!-- skip-example -->
```js
//.markdown-doctest-setup.js
module.exports = {
  babel: {
    stage: 0
  }
}
```

You can also disable `babel` support. This will speed things up drastically:

<!-- skip-example -->
```js
//.markdown-doctest-setup.js
module.exports = {
  babel: false
}
```

What if I have global state that needs to be reset after my examples run?
---
<!-- skip-example -->
```js
//.markdown-doctest-setup.js
module.exports = {
  beforeEach: function () {
    // reset your awesome global state
  }
}
```

You can specify a function to be run before each example in your `.markdown-doctest-setup.js`.

Who uses markdown-doctest?
---

All of these projects either run `markdown-doctest` with `npm test` or as part of their CI process:

* [lodash](https://github.com/lodash/lodash)
* [RxJS](https://github.com/ReactiveX/RxJS)
* [most](https://github.com/cujojs/most)
* [xstream](https://github.com/staltz/xstream)
* [rx.schedulers](https://github.com/Reactive-Extensions/rx.schedulers)
* [rx.priorityqueue](https://github.com/Reactive-Extensions/rx.priorityqueue)
* [rx.disposables](https://github.com/Reactive-Extensions/rx.disposables)
* [rx-undoable](https://github.com/Widdershin/rx-undoable)
