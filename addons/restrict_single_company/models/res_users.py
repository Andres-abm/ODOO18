# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class ResUsers(models.Model):
    _inherit = 'res.users'

    allow_multi_company = fields.Boolean(
        string='Allow Multiple Company Selection',
        compute='_compute_allow_multi_company',
        store=False,
        help='If enabled, user can select multiple companies at once'
    )

    @api.depends('groups_id')
    def _compute_allow_multi_company(self):
        """Compute if user has permission to select multiple companies"""
        multi_company_group = self.env.ref(
            'restrict_single_company.group_multi_company_selection',
            raise_if_not_found=False
        )
        for user in self:
            user.allow_multi_company = multi_company_group and multi_company_group in user.groups_id

    def write(self, vals):
        """Override write to validate company selection"""
        res = super(ResUsers, self).write(vals)
        
        # Check if company_ids is being modified
        if 'company_ids' in vals:
            for user in self:
                # Skip validation for users with multi-company permission
                if user.allow_multi_company:
                    continue
                    
                # Validate that user has only one company selected
                if len(user.company_ids) > 1:
                    raise ValidationError(_(
                        'You do not have permission to select multiple companies. '
                        'Please select only one company at a time.'
                    ))
        
        return res

    @api.model
    def get_user_company_restriction(self):
        """Return if current user can select multiple companies"""
        user = self.env.user
        return {
            'allow_multi_company': user.allow_multi_company,
            'company_ids': user.company_ids.ids,
        }
