# markdown-doctest
Test all the code in your markdown docs!

Why on earth?
---

Well, I don't know about you, but I write a lot of code examples in markdown. Some projects write all their documentation as markdown, like [RxJS](https://github.com/Reactive-Extensions/RxJS).

I also don't always stop to make sure that the code I write in my documentation *actually works*.

That seems like an important step, but it's often missed out, especially when you're just making a small change to somebody else's docs.

Okay, so we want our examples to at least run, that seems reasonable. How?
---

Well, that's where `markdown-doctest` comes into play.

Just `npm install markdown-doctest` and run `find . -name '*.md' | markdown-doctest`. It scans your directory for `.md` files, extracts the code examples and then runs them.

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

Aren't there tons of problems with that approach?
---

Why yes! Yes, there are. Here are some of the things that can go wrong:

 * Examples often assume they have access to variables or modules that aren't actually there
 * Some examples mix code and pseudo code, which results in syntax errors!
 * Examples might run just fine while producing the wrong result. `markdown-doctest` won't even blink

`markdown-doctest` doesn't actually attempt to provide any guarantee that your code worked, only that it didn't explode in a horrible fashion. If you would like to use `markdown-doctest` for that purpose, you can add some `assert`s to your examples.

So why would you use `markdown-doctest`?
---

Because even though all of that can go wrong, it's still nice to know that your examples have no syntax errors and can be run by users.

`markdown-doctest` is not a replacement for your test suite. It's designed to run with your CI build and give you peace of mind that all of your examples are at least vaguely runnable.

I plan on adding features to mitigate the above problems, including the ability to disable testing examples that aren't actually runnable!

Currently, `markdown-doctest` only supports javascript, and you have to make sure you write your examples like this:

\`\`\`js
console.log("Hello world");
\`\`\`

Note the `js` after the three backticks. That's what's used to find examples to run (and by Github to determine syntax highlighting). It looks like this:

```js
console.log("Hello world");
```
