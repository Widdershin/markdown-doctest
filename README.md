# markdown-doctest
Test all the code in your markdown docs!

Why on earth?
---

As an open source developer, there are few things more embarassing than a user opening an issue to inform you that your README example is broken! With  `markdown-doctest`, you can rest easy knowing that your example code is *actually runnable*.

Just `npm install markdown-doctest` and run `find . -name '*.md' | markdown-doctest`. It will run all of the Javascript code examples tucked away in your markdown, and let you know if any blow up.

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
$ find . -name '*.md' | markdown-doctest
Failed - README.md:27:17
ReferenceError: c is not defined

1/2 passing
```

Awesome! No excuse for broken documentation ever again right?

Note: `markdown-doctest` doesn't actually attempt to provide any guarantee that your code worked, only that it didn't explode in a horrible fashion. If you would like to use `markdown-doctest` for actually testing the correctness of your code, you can add some `assert`s to your examples.


`markdown-doctest` is not a replacement for your test suite. It's designed to run with your CI build and give you peace of mind that all of your examples are at least vaguely runnable.

Set up logic
---

You can `require` any needed modules or example helpers in `.markdown-doctest-setup.js`. E.g:

```js
module.exports = {
  Rx: require('rx')
}
```

Anything exported by `.markdown-doctest-setup` will be available globally in your examples.

Limitations
---

I plan on adding the ability to disable testing examples that aren't actually runnable!

Currently, `markdown-doctest` only supports javascript, and you have to make sure you write your examples like this:


    ```js
    console.log("Hello world");
    ```


Note the `js` after the three backticks. That's what's used to find examples to run (and by Github to determine syntax highlighting). It looks like this:

```js
console.log("Hello world");
```
