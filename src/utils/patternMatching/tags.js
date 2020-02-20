/**
 * A utility for finding HTML and XML tags in a string, and one for removing them.
 *
 * @module utils/patternMatching/tags
 * @since 3.6.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * Get a regular expression for matching all HTML and XML tags in a string.
 *
 * @param {boolean} [groupSequentialTags=false] - Keep sequential tags together. Useful if you want to strip tags and replace them with a space.
 * @returns {RegExp}
 *
 * @example
 * import { tagsRegex } from "./utils/patternMatching/tags";
 *
 * const markup = "<p><b>Bold move.</b><br/>Paragraph.</p><!-- comment -->";
 * const stripped = markup.replace(tagsRegex(), ""); // = "Bold move.Paragraph."
 */
export function tagsRegex(groupSequentialTags = false) {
    return new RegExp(
        `(<\\/?[a-z!?][^>]*>)${groupSequentialTags ? "+" : ""}`,
        "ig"
    );
}

/**
 * Strip HTML and XML tags from string. Tags are replaced with a space.
 *
 * @param {string} markup - String to strip of HTML and XML tags.
 * @param {boolean} replaceWithSpace - Replace tags with a space.
 * @returns {string} The supplied string stripped for tags.
 *
 * @example
 * import { stripTags } from "./utils/patternMatching/tags";
 *
 * const markup = "<p><b>Bold move.</b><br/>Paragraph.</p><!-- comment -->";
 * const stripped = stripTags(markup); // = "Bold move. Paragraph."
 */
export function stripTags(markup, replaceWithSpace = true) {
    return markup.replace(
        tagsRegex(replaceWithSpace),
        replaceWithSpace ? " " : ""
    );
}
