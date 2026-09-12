// Components handed to every rendered MDX/MD body via `<Content components>`,
// covering JSX used WITHOUT an explicit import (the Gatsby GlobalMdx provider
// supplied Image/DoDont/Flex implicitly). Explicit imports in content resolve
// to the same .astro shims through the Vite aliases in astro.config.mjs.
import Box from '../../shims/c/Box.astro'
import Grid from '../../shims/c/Grid.astro'
import Flex from '../../shims/c/Flex.astro'
import Button from '../../shims/c/Button.astro'
import Embed from '../../shims/c/Embed.astro'
import Image from '../../shims/c/Image.astro'
import DoDont from '../../shims/c/DoDont.astro'
import Heading from '../../shims/c/Heading.astro'
import Text from '../../shims/c/Text.astro'
import Link from '../../shims/c/Link.astro'
import Icon from '../../shims/c/Icon.astro'
import ColorSwatch from '../../shims/c/ColorSwatch.astro'

export const mdxComponents = {
	Box,
	Grid,
	Flex,
	Button,
	Embed,
	Image,
	DoDont,
	Heading,
	Text,
	Link,
	Icon,
	ColorSwatch,
}
