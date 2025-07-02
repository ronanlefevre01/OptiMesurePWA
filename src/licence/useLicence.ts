import { useEffect, useState } from 'react';

export type LicenceData = {
  cle: string;
  nom: string;
  validite: string; // <-- utilisé pour la date d'expiration
  cachet: string;
  modules: {
    avance: boolean;
    video: boolean;
    profil: boolean;
    ia: boolean;
  };
};

export function useLicence() {
  const [licence, setLicence] = useState<(LicenceData & { joursRestants: number }) | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    fetch('/licence/licence.json')
      .then((res) => {
        if (!res.ok) throw new Error('Fichier licence introuvable');
        return res.json();
      })
      .then((data: LicenceData) => {
        console.log("✅ Licence chargée :", data);

        const today = new Date();
        const expiry = new Date(data.validite); // ← utilise bien le champ "validite"
        const diffTime = expiry.getTime() - today.getTime();
        const joursRestants = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log("📅 Aujourd'hui :", today.toISOString());
        console.log("📅 Expire le :", expiry.toISOString());
        console.log("📆 Jours restants :", joursRestants);

        if (joursRestants < 0) {
          console.log("❌ Licence expirée");
          setErreur('Licence expirée');
        } else {
          console.log("✅ Licence valide");
          setLicence({ ...data, joursRestants });
        }
      })
      .catch((err) => {
        console.error(err);
        setErreur('Erreur lors du chargement de la licence');
      });
  }, []);

  return { licence, erreur };
}


