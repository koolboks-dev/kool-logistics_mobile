import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';

/**
 * Font map passed to useFonts(). The keys become the family names used in
 * FontFamily, so text metrics are identical on iOS and Android.
 *
 * Imported per-weight, not from the package barrel: the barrel `require`s all
 * 18 Poppins weights (~3MB) and Metro has no way to shake them out.
 */
export const AppFonts = {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
};
