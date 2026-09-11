import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameInput from '../GameInput';
import { loadPokemonData } from '@/lib/pokemon';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    'game.inputPlaceholder': 'Enter Pokémon name', 'game.submit': 'Submit',
    'game.giveUp': 'Give Up', 'game.restart': 'Restart', 'game.randomStart': 'Random Guess',
    'game.confirmAction': 'Confirm', 'common.cancel': 'Cancel',
  })[key] ?? key,
  useLocale: () => 'en',
}));

const props = {
  pokemon: loadPokemonData().filter((row) => row.pokedex_id_national <= 4),
  onSubmit: jest.fn<Promise<boolean>, [string]>(),
  onRandomStart: jest.fn(), onGiveUp: jest.fn(), onRestart: jest.fn(),
  disabled: false, gameStarted: false, gameOver: false,
};

beforeEach(() => { jest.clearAllMocks(); props.onSubmit.mockResolvedValue(true); });

test('uses an accessible combobox with image, translated name and national number', async () => {
  render(<GameInput {...props} />);
  await userEvent.type(screen.getByRole('combobox'), 'フシギダネ');
  const option = await screen.findByRole('option', { name: /Bulbasaur/ });
  expect(option).toHaveTextContent('#0001');
  expect(option.querySelector('img')).toBeInTheDocument();
  await userEvent.click(option);
  expect(screen.getByRole('combobox')).toHaveValue('Bulbasaur');
  expect(props.onSubmit).not.toHaveBeenCalled();
});

test('supports keyboard selection and submission', async () => {
  render(<GameInput {...props} />);
  const input = screen.getByRole('combobox');
  await userEvent.type(input, 'Bulb');
  await screen.findByRole('option', { name: /Bulbasaur/ });
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(input).toHaveValue('Bulbasaur');
  expect(props.onSubmit).not.toHaveBeenCalled();
  await userEvent.keyboard('{Enter}');
  await waitFor(() => expect(props.onSubmit).toHaveBeenCalledWith('bulbasaur'));
  await waitFor(() => expect(input).toHaveValue(''));
});

test('accepts a unique national number and keeps failed input available for retry', async () => {
  props.onSubmit.mockResolvedValueOnce(false);
  render(<GameInput {...props} />);
  const input = screen.getByRole('combobox');
  await userEvent.type(input, '#0001');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
  expect(props.onSubmit).toHaveBeenCalledWith('bulbasaur');
  await waitFor(() => expect(input).toBeEnabled());
  expect(input).toHaveValue('#0001');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
  await waitFor(() => expect(input).toHaveValue(''));
  expect(props.onSubmit).toHaveBeenCalledTimes(2);
});

test('does not submit while confirming IME input', async () => {
  render(<GameInput {...props} />);
  const input = screen.getByRole('combobox');
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: '妙蛙种子' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', isComposing: true });
  expect(props.onSubmit).not.toHaveBeenCalled();
  fireEvent.compositionEnd(input);
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
  expect(props.onSubmit).toHaveBeenCalledWith('bulbasaur');
});

test('prevents repeated submissions while a request is outstanding', async () => {
  let resolve!: (value: boolean) => void;
  props.onSubmit.mockReturnValue(new Promise<boolean>((done) => { resolve = done; }));
  render(<GameInput {...props} />);
  await userEvent.type(screen.getByRole('combobox'), 'Bulbasaur');
  await userEvent.dblClick(screen.getByRole('button', { name: 'Submit' }));
  expect(props.onSubmit).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('combobox')).toBeDisabled();
  await act(async () => resolve(true));
  expect(screen.getByRole('combobox')).toHaveValue('');
});

test('a rejected request also preserves the input', async () => {
  props.onSubmit.mockRejectedValue(new Error('Connection lost'));
  render(<GameInput {...props} />);
  await userEvent.type(screen.getByRole('combobox'), 'Bulbasaur');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('game.requestFailed');
  expect(screen.getByRole('combobox')).toHaveValue('Bulbasaur');
});

test.each(['Give Up', 'Restart'])('requires confirmation before %s ends an active game', async (name) => {
  render(<GameInput {...props} gameStarted />);
  await userEvent.click(screen.getByRole('button', { name }));
  expect(props.onGiveUp).not.toHaveBeenCalled();
  expect(props.onRestart).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(name === 'Give Up' ? props.onGiveUp : props.onRestart).toHaveBeenCalledTimes(1);
});

test('starts a random guess and restarts a finished game directly', async () => {
  const { rerender } = render(<GameInput {...props} />);
  await userEvent.click(screen.getByRole('button', { name: 'Random Guess' }));
  expect(props.onRandomStart).toHaveBeenCalledTimes(1);
  rerender(<GameInput {...props} gameStarted gameOver />);
  expect(screen.getByRole('combobox')).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Restart' }));
  expect(props.onRestart).toHaveBeenCalledTimes(1);
});
