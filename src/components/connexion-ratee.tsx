import { Bouton, Ecran, Logo } from '@/components/ui';

// Affiché à la place de l'app quand la connexion (compte anonyme) n'a pas pu se faire.
export function ConnexionRatee({ message, onReessayer }: { message: string; onReessayer: () => void }) {
  return (
    <Ecran centre enTete={<Logo />} titre="Connexion impossible" intro={message}>
      <Bouton label="Réessayer" onPress={onReessayer} />
    </Ecran>
  );
}
