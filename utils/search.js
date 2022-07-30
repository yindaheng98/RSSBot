async function search_cats_title_by_feeds(feeds, rss_driver) {
    let cats = [];
    for (let feed of feeds) {
        let category_id = await rss_driver.isSubscribed(feed);
        if (category_id) {
            cats.push(await rss_driver.getCategoryTitle(category_id));
        }
    }
    return cats;
}
module.exports = { search_cats_title_by_feeds };