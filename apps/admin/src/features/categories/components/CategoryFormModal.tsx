import {
  Alert,
  Button,
  Center,
  confirmModal,
  Empty,
  Input,
  Modal,
  Skeleton,
  Text,
  toast,
  Tooltip,
} from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useMutation } from '@tanstack/react-query'
import { ArrowUpRight, Trash2 } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import type { CategoryEntity } from '~/data/resources/category'
import { saveCategory } from '~/data/resources/category.mutations'

import { useCategoryCopy } from '../copy'
import {
  useConfirmDeleteCategory,
  useInvalidateCategories,
} from '../hooks/use-category-mutations'
import { categoryFormSchema, type CategoryFormValues } from '../schema'
import { categoryStyles } from '../styles'
import { slugify } from '../utils/slug'

interface CategoryFormModalProps {
  category?: CategoryEntity
  isLast?: boolean
  mode: 'create' | 'edit'
  onClose: () => void
  onSaved?: (category: CategoryEntity) => void
  open: boolean
}

export function CategoryFormModal(props: CategoryFormModalProps) {
  const { text } = useCategoryCopy()
  const dirtyRef = useRef(false)

  const requestClose = () => {
    if (!dirtyRef.current) {
      props.onClose()
      return
    }
    confirmModal({
      cancelText: text('keepEditing'),
      content: text('discardBody'),
      okButtonProps: { danger: true },
      okText: text('discardConfirm'),
      onOk: () => {
        dirtyRef.current = false
        props.onClose()
      },
      title: text('discardTitle'),
    })
  }

  return (
    <Modal
      destroyOnHidden
      footer={null}
      onCancel={requestClose}
      open={props.open}
      title={props.mode === 'create' ? text('create') : text('editTitle')}
      width={480}
    >
      {props.open ? (
        <CategoryFormBody
          {...props}
          key={props.category?.id ?? 'create'}
          onCancel={requestClose}
          onDirtyChange={(dirty) => {
            dirtyRef.current = dirty
          }}
        />
      ) : null}
    </Modal>
  )
}

function CategoryFormBody(
  props: CategoryFormModalProps & {
    onCancel: () => void
    onDirtyChange: (dirty: boolean) => void
  },
) {
  const { text } = useCategoryCopy()
  const navigate = useNavigate()
  const invalidateCategories = useInvalidateCategories()
  const confirmDelete = useConfirmDeleteCategory()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const slugTouchedRef = useRef(props.mode === 'edit')
  const schema = useMemo(
    () =>
      categoryFormSchema({
        name: text('nameRequired'),
        slug: text('slugRequired'),
      }),
    [text],
  )

  const saveMutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      saveCategory(
        props.mode === 'edit' && props.category
          ? { id: props.category.id, kind: 'edit' }
          : { kind: 'create' },
        { name: values.name.trim(), slug: values.slug.trim() },
      ),
  })

  const form = useForm<CategoryFormValues>({
    initialValues: {
      name: props.category?.name ?? '',
      slug: props.category?.slug ?? '',
    },
    onSubmit: async (values) => {
      setSubmitError(null)
      try {
        const saved = await saveMutation.mutateAsync(values)
        if (!saved) {
          setSubmitError(text('saveFailed'))
          return
        }
        props.onDirtyChange(false)
        toast.success(props.mode === 'create' ? text('created') : text('saved'))
        await invalidateCategories()
        props.onSaved?.(saved)
        props.onClose()
      } catch {
        setSubmitError(text('saveFailed'))
      }
    },
    onValuesChange: () => setSubmitError(null),
    schema,
  })

  useEffect(() => {
    form.setSchema(schema)
  }, [form, schema])

  const onDirtyChangeRef = useRef(props.onDirtyChange)
  onDirtyChangeRef.current = props.onDirtyChange

  useEffect(() => {
    return form.subscribe(
      (values) => `${values.name}\n${values.slug}`,
      () => onDirtyChangeRef.current(form.isDirty()),
    )
  }, [form])

  const count = props.category?.count ?? 0
  const openPosts = (id: string) => {
    navigate({
      pathname: '/posts',
      search: `?category=${encodeURIComponent(id)}`,
    })
  }
  const category = props.category
  let posts: ReactNode = null
  if (props.mode === 'edit' && category) {
    posts = (
      <div className={categoryStyles.posts}>
        {count > 0 ? (
          <>
            <Text type="secondary">
              {count === 1
                ? text('viewPostsOne')
                : text('viewPosts', { count })}
            </Text>
            <Button
              htmlType="button"
              icon={ArrowUpRight}
              iconPosition="end"
              onClick={() => openPosts(category.id)}
              size="small"
              type="text"
            >
              {text('viewPostsTitle')}
            </Button>
          </>
        ) : (
          <Text type="secondary">{text('noPosts')}</Text>
        )}
      </div>
    )
  }

  const deleteButton =
    props.mode === 'edit' && category ? (
      <Tooltip title={count > 0 ? text('deleteBlocked', { count }) : undefined}>
        <span>
          <Button
            danger
            disabled={count > 0}
            htmlType="button"
            icon={Trash2}
            onClick={() =>
              confirmDelete(category, {
                isLast: props.isLast ?? false,
                onDeleted: () => {
                  props.onDirtyChange(false)
                  props.onClose()
                },
              })
            }
            type="text"
          >
            {text('delete')}
          </Button>
        </span>
      </Tooltip>
    ) : (
      <span />
    )

  return (
    <Form
      footer={
        <div className={categoryStyles.modalFooter}>
          {deleteButton}
          <div className={categoryStyles.modalFooter}>
            <Button htmlType="button" onClick={props.onCancel}>
              {text('cancel')}
            </Button>
            <Button
              htmlType="submit"
              loading={saveMutation.isPending}
              type="primary"
            >
              {props.mode === 'create' ? text('create') : text('save')}
            </Button>
          </div>
        </div>
      }
      form={form}
      gap={16}
      layout="vertical"
    >
      {submitError ? <Alert showIcon title={submitError} type="error" /> : null}
      <Form.Field
        label={text('nameLabel')}
        name="name"
        required={text('nameRequired')}
      >
        <Input
          autoFocus
          onChange={(event) => {
            if (slugTouchedRef.current) return
            form.setValue('slug', slugify(event.target.value))
          }}
          placeholder={text('namePlaceholder')}
        />
      </Form.Field>
      <Form.Field
        desc={text('slugHint')}
        label={text('slugLabel')}
        name="slug"
        required={text('slugRequired')}
      >
        <Input
          className={categoryStyles.slugInput}
          onChange={() => {
            slugTouchedRef.current = true
          }}
          placeholder={text('slugPlaceholder')}
        />
      </Form.Field>
      {posts}
    </Form>
  )
}

export function CategoryModalState(props: {
  action?: ReactNode
  description?: ReactNode
  loading?: boolean
  onClose: () => void
  title: ReactNode
}) {
  const { text } = useCategoryCopy()
  return (
    <Modal
      footer={null}
      onCancel={props.onClose}
      open
      title={text('editTitle')}
      width={480}
    >
      {props.loading ? (
        <div className={categoryStyles.modalBody}>
          <Skeleton height={32} width="100%" />
          <Skeleton height={32} width="100%" />
        </div>
      ) : (
        <Center paddingBlock={16}>
          <Empty
            action={props.action}
            description={props.description}
            title={props.title}
          />
        </Center>
      )}
    </Modal>
  )
}
