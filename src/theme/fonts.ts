import { WorkSans_400Regular } from '@expo-google-fonts/work-sans/400Regular';
import { WorkSans_500Medium } from '@expo-google-fonts/work-sans/500Medium';
import { WorkSans_600SemiBold } from '@expo-google-fonts/work-sans/600SemiBold';
import { WorkSans_700Bold } from '@expo-google-fonts/work-sans/700Bold';

/**
 * Font map passed to useFonts(). The keys become the family names used in
 * FontFamily, so text metrics are identical on iOS and Android.
 *
 * Work Sans — the same face as the Koolboks Sales CRM and the web consoles
 * (CRM DESIGN.md §4). Imported per weight, not from the package barrel: the
 * barrel `require`s every weight and Metro has no way to shake them out.
 */
export const AppFonts = {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
};
