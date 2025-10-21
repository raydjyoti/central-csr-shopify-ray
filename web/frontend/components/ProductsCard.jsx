import { Card, TextContainer, Text } from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";

export function ProductsCard() {
  const { t } = useTranslation();

  const {
    data,
    refetch: refetchProductCount,
    isLoading: isLoadingCount,
  } = useQuery({
    queryKey: ["productCount"],
    queryFn: async () => {
      const response = await fetch("/api/products/count");
      return await response.json();
    },
    refetchOnWindowFocus: false,
  });

  return (
    <Card
      title={t("ProductsCard.title")}
      sectioned
    >
      <TextContainer spacing="loose">
        <p>{t("ProductsCard.description")}</p>
        <Text as="h4" variant="headingMd">
          {t("ProductsCard.totalProductsHeading")}
          <Text variant="bodyMd" as="p" fontWeight="semibold">
            {isLoadingCount ? "-" : data?.count}
          </Text>
        </Text>
      </TextContainer>
    </Card>
  );
}
