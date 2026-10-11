/** Blog search: a plain GET form to /blog/search, so it works without JavaScript and the results page can stay out of the index. */
export default function BlogSearchForm({ defaultValue = "", id = "blog-q" }: { defaultValue?: string; id?: string }) {
  return (
    <form role="search" action="/blog/search" method="get" className="mx-auto flex w-full max-w-xl items-stretch gap-2">
      <label htmlFor={id} className="sr-only">Search the blog</label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        maxLength={100}
        placeholder="Search guides, quizzes and study help"
        autoComplete="off"
        className="min-h-[48px] w-full rounded-xl border border-black/[0.18] bg-white px-4 text-[16px] text-ink placeholder:text-ink-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep"
      />
      <button type="submit" className="min-h-[48px] shrink-0 rounded-xl bg-orange-deep px-5 text-[15px] font-semibold text-white hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep">
        Search
      </button>
    </form>
  );
}
