import { pageMetadata } from '../seo';

const originalSite = process.env.TWITTER_SITE;
const originalCreator = process.env.TWITTER_CREATOR;
afterEach(() => {
  if (originalSite === undefined) delete process.env.TWITTER_SITE;
  else process.env.TWITTER_SITE = originalSite;
  if (originalCreator === undefined) delete process.env.TWITTER_CREATOR;
  else process.env.TWITTER_CREATOR = originalCreator;
});
const metadata = () => pageMetadata({ locale: 'en', title: 'Poke Wordle', description: 'Guess the Pokémon', path: '/', languages: { en: '/' } });

test('optional social accounts are omitted when absent or blank', () => {
  delete process.env.TWITTER_SITE;
  process.env.TWITTER_CREATOR = '  ';
  expect(metadata().twitter).toMatchObject({ site: undefined, creator: undefined });
});

test('configured social handles are trimmed and independent', () => {
  process.env.TWITTER_SITE = ' @example_site ';
  delete process.env.TWITTER_CREATOR;
  expect(metadata().twitter).toMatchObject({ site: '@example_site', creator: undefined });
  process.env.TWITTER_CREATOR = '@example_author';
  expect(metadata().twitter).toMatchObject({ site: '@example_site', creator: '@example_author' });
});

test.each(['example_site', 'https://x.com/example', '@invalid-handle', '@this_name_is_too_long'])('invalid account configuration %s fails instead of publishing incorrect metadata', (handle) => {
  delete process.env.TWITTER_CREATOR;
  process.env.TWITTER_SITE = handle;
  expect(metadata).toThrow('Twitter metadata must use a real @username');
});
