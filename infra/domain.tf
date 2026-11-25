# ---------------------------------------------------------------------------
# Optional custom domain for the frontend (set `domain_name` in the stage's
# tfvars). The parent zone must be a Route53 hosted zone in this account:
# terraform validates the certificate and points the name at CloudFront.
# Stages without `domain_name` keep the default *.cloudfront.net address.
# ---------------------------------------------------------------------------

locals {
  has_domain   = var.domain_name != ""
  frontend_url = "https://${local.has_domain ? var.domain_name : aws_cloudfront_distribution.frontend.domain_name}"
}

# CloudFront only accepts certificates from us-east-1, whatever var.region is.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = var.project
      Stage     = var.stage
      ManagedBy = "terraform"
    }
  }
}

data "aws_route53_zone" "frontend" {
  count        = local.has_domain ? 1 : 0
  name         = var.hosted_zone_name
  private_zone = false
}

resource "aws_acm_certificate" "frontend" {
  count             = local.has_domain ? 1 : 0
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "frontend_cert_validation" {
  for_each = {
    for o in(local.has_domain ? aws_acm_certificate.frontend[0].domain_validation_options : []) :
    o.domain_name => o
  }

  zone_id         = data.aws_route53_zone.frontend[0].zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  records         = [each.value.resource_record_value]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "frontend" {
  count                   = local.has_domain ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.frontend[0].arn
  validation_record_fqdns = [for r in aws_route53_record.frontend_cert_validation : r.fqdn]
}

resource "aws_route53_record" "frontend" {
  count = local.has_domain ? 1 : 0

  zone_id = data.aws_route53_zone.frontend[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
