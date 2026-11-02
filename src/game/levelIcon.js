const ANIMALS = ['bear', 'cat', 'fox', 'frog', 'chick', 'owl']

export function levelIcon(level) {
  if (level?.goalType === 'collect') {
    const animal = Object.keys(level.goalPayload ?? {}).find((key) => ANIMALS.includes(key))
    if (animal) return animal
  }
  return ANIMALS[((level?.id ?? 1) - 1) % ANIMALS.length]
}
