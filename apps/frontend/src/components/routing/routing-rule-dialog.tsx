'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { t, tDynamic } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateRoutingRule,
  useUpdateRoutingRule,
  useCreateRoutingRuleFromTemplate,
  useRoutingTemplates,
} from '@/hooks/use-routing-rules';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import type {
  RoutingRuleResponseDto,
  LogicalOperator,
  ConditionItemDto,
  RoutingConditionsDto,
} from '@/hooks/use-routing-rules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoutingRuleFormFields } from './routing-rule-form-fields';

interface RoutingRuleDialogProps {
  urlId: string;
  rule?: RoutingRuleResponseDto;
  trigger?: React.ReactNode;
}

export function RoutingRuleDialog({ urlId, rule, trigger }: RoutingRuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'custom' | 'template'>('custom');
  const [name, setName] = useState(rule?.name || '');
  const [targetUrl, setTargetUrl] = useState(rule?.targetUrl || '');
  const [priority, setPriority] = useState(rule?.priority ?? 0);
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [logicOp, setLogicOp] = useState<LogicalOperator>(rule?.conditions?.operator || 'AND');
  const [conditions, setConditions] = useState<ConditionItemDto[]>(
    rule?.conditions?.conditions || [
      { type: 'country', operator: 'equals', value: '' },
    ]
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const { toast } = useToast();
  const createMutation = useCreateRoutingRule();
  const updateMutation = useUpdateRoutingRule();
  const templateMutation = useCreateRoutingRuleFromTemplate();
  const { data: templatesData } = useRoutingTemplates();

  const isEdit = !!rule;
  const mutation = isEdit ? updateMutation : createMutation;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (rule) {
        setName(rule.name);
        setTargetUrl(rule.targetUrl);
        setPriority(rule.priority);
        setIsActive(rule.isActive);
        setLogicOp(rule.conditions?.operator || 'AND');
        setConditions(rule.conditions?.conditions || [{ type: 'country', operator: 'equals', value: '' }]);
      } else {
        setName('');
        setTargetUrl('');
        setPriority(0);
        setIsActive(true);
        setLogicOp('AND');
        setConditions([{ type: 'country', operator: 'equals', value: '' }]);
        setSelectedTemplate('');
        setActiveTab('custom');
      }
    }
  }, [open, rule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const conditionsDto: RoutingConditionsDto = {
        operator: logicOp,
        conditions: conditions.map(c => ({
          ...c,
          value: c.value || '',
        })),
      };

      if (isEdit) {
        await updateMutation.mutateAsync({
          urlId,
          ruleId: rule.id,
          data: { name, targetUrl, priority, isActive, conditions: conditionsDto },
        });
      } else {
        await createMutation.mutateAsync({
          urlId,
          data: { name, targetUrl, priority, isActive, conditions: conditionsDto },
        });
      }

      toast({
        title: isEdit ? t('routing.updated') : t('routing.created'),
        description: isEdit
          ? t('routing.updatedDesc')
          : t('routing.createdDesc'),
      });

      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('routing.createErrorDesc');
      toast({
        title: t('routing.createError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplate) {
      toast({
        title: t('routing.selectTemplateError'),
        description: t('routing.selectTemplateErrorDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await templateMutation.mutateAsync({
        urlId,
        data: {
          templateKey: selectedTemplate,
          targetUrl,
          name: name || undefined,
          priority,
        },
      });

      toast({
        title: t('routing.created'),
        description: t('routing.createdFromTemplateDesc'),
      });

      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('routing.createErrorDesc');
      toast({
        title: t('routing.createError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('routing.create')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('routing.edit') : t('routing.create')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('routing.editDesc') : t('routing.createDesc')}
          </DialogDescription>
        </DialogHeader>

        {!isEdit && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'custom' | 'template')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="custom">{t('routing.customRule')}</TabsTrigger>
              <TabsTrigger value="template">
                <Sparkles className="mr-2 h-4 w-4" />
                {t('routing.fromTemplate')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="custom">
              <form onSubmit={handleSubmit} className="space-y-4">
                <RoutingRuleFormFields
                  idPrefix="create-"
                  name={name}
                  targetUrl={targetUrl}
                  priority={priority}
                  isActive={isActive}
                  logicOp={logicOp}
                  conditions={conditions}
                  onNameChange={setName}
                  onTargetUrlChange={setTargetUrl}
                  onPriorityChange={setPriority}
                  onIsActiveChange={setIsActive}
                  onLogicOpChange={setLogicOp}
                  onConditionsChange={setConditions}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.create')}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="template">
              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                {/* Template Selection */}
                <div className="grid gap-2">
                  <Label>{t('routing.selectTemplate')}</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('routing.selectTemplatePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesData?.templates.map((template) => (
                        <SelectItem key={template.key} value={template.key}>
                          <div className="flex flex-col">
                            <span>{tDynamic(`routing.templates.${template.key}.name`, template.name)}</span>
                            <span className="text-xs text-muted-foreground">
                              {tDynamic(`routing.templates.${template.key}.description`, template.description)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Name (optional) */}
                <div className="grid gap-2">
                  <Label htmlFor="templateName">{t('routing.nameOptional')}</Label>
                  <Input
                    id="templateName"
                    placeholder={t('routing.templateNamePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                {/* Target URL */}
                <div className="grid gap-2">
                  <Label htmlFor="templateTargetUrl">{t('routing.targetUrlRequired')}</Label>
                  <Input
                    id="templateTargetUrl"
                    type="url"
                    placeholder={t('routing.targetUrlPlaceholder')}
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    required
                  />
                </div>

                {/* Priority */}
                <div className="grid gap-2">
                  <Label htmlFor="templatePriority">{t('routing.priority')}</Label>
                  <Input
                    id="templatePriority"
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    min={0}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={templateMutation.isPending}>
                    {templateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.create')}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        )}

        {isEdit && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <RoutingRuleFormFields
              idPrefix="edit-"
              name={name}
              targetUrl={targetUrl}
              priority={priority}
              isActive={isActive}
              logicOp={logicOp}
              conditions={conditions}
              onNameChange={setName}
              onTargetUrlChange={setTargetUrl}
              onPriorityChange={setPriority}
              onIsActiveChange={setIsActive}
              onLogicOpChange={setLogicOp}
              onConditionsChange={setConditions}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
