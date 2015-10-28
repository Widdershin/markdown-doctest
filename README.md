# markdown-doctest
Test all the code in your markdown docs!

Why on earth?
---

As an open source developer, there are few things more embarassing than a user opening an issue to inform you that your README example is broken! With  `markdown-doctest`, you can rest easy knowing that your example code is *actually runnable*.

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

I have a code example I don't want tested!
---
You can tell `markdown-doctest` to skip examples by adding `<!-- skip-test -->` before the example. E.g:

    <!-- skip-test -->
    ```js
    // not a runnable example

    var foo = download(...);
    ```

How do requires work? And other setup logic?
---

You can `require` any needed modules or example helpers in `.markdown-doctest-setup.js`. E.g:

<!-- skip-test -->
```js
// .markdown-doctest-setup.js
module.exports = {
  require: {
    Rx: require('rx')
  }
}
```

Anything exported under `require` will then be used by any examples that `require` that key.
You must explicitly configure all of the dependencies used in your examples.

Limitations
---

Currently, `markdown-doctest` only supports javascript, and you have to make sure you write your examples like this:


    ```js
    console.log("Hello world");
    ```


Note the `js` after the three backticks. That's what's used to find examples to run (and by Github to determine syntax highlighting). It looks like this:

```js
console.log("Hello world");
```
