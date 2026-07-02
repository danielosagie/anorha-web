import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

type AndroidAccessTemplateProps = {
  /** The Google Play opt-in / install URL. When present, the email shows a
   *  one-tap "Get Anorha on Android" button (fully self-serve). When absent
   *  (open testing not live yet), it shows a "your invite is on the way" note. */
  readonly accessUrl?: string;
};

export const AndroidAccessTemplate = ({
  accessUrl,
}: AndroidAccessTemplateProps) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>Your Anorha Android access</Preview>
      <Body className="bg-zinc-50 font-sans">
        <Container className="mx-auto py-12">
          <Section className="mt-8 rounded-md bg-zinc-200 p-px">
            <Section className="rounded-[5px] bg-white p-8">
              <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
                You&apos;re in — welcome to Anorha
              </Text>

              {accessUrl ? (
                <>
                  <Text className="m-0 text-zinc-600">
                    Thanks for joining the Anorha beta on Android. Tap the button
                    below on your Android phone to install the app.
                  </Text>
                  <Section className="my-6 text-center">
                    <Button
                      href={accessUrl}
                      className="rounded-lg bg-[#647653] px-6 py-3 font-semibold text-white"
                    >
                      Get Anorha on Android
                    </Button>
                  </Section>
                  <Text className="m-0 text-zinc-500 text-sm">
                    If the button doesn&apos;t work, open this link on your phone:
                    <br />
                    {accessUrl}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="m-0 text-zinc-600">
                    Thanks for joining the Anorha beta on Android — you&apos;re on
                    the list. We&apos;ll email your install link shortly, so keep an
                    eye on your inbox.
                  </Text>
                  <Text className="mt-4 mb-0 text-zinc-500 text-sm">
                    Already on iPhone? You can start today on TestFlight.
                  </Text>
                </>
              )}

              <Hr className="my-6" />
              <Text className="m-0 text-zinc-400 text-xs">
                You received this because you requested Android access at
                anorha.com. If that wasn&apos;t you, you can ignore this email.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

AndroidAccessTemplate.PreviewProps = {
  accessUrl: 'https://play.google.com/apps/testing/anorha.alpha',
};

export default AndroidAccessTemplate;
