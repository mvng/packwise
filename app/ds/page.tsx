'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 md:p-12 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-16">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Design System</h1>
          <p className="text-gray-500 text-lg">A unified collection of primitive styles, tokens, and components.</p>
        </div>

        {/* Tokens Section */}
        <section className="space-y-8">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">Design Tokens</h2>
            <p className="text-gray-500 text-sm mt-1">Foundational design elements: Colors, Typography, and Sizing.</p>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Colors (Tailwind Scale)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-blue-50 border shadow-sm"></div>
                <div className="text-sm font-medium">Blue 50</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-blue-100 border shadow-sm"></div>
                <div className="text-sm font-medium">Blue 100</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-blue-500 shadow-sm"></div>
                <div className="text-sm font-medium">Blue 500</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-blue-600 shadow-sm"></div>
                <div className="text-sm font-medium">Blue 600 (Primary)</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-blue-700 shadow-sm"></div>
                <div className="text-sm font-medium">Blue 700</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-gray-50 border shadow-sm"></div>
                <div className="text-sm font-medium">Gray 50</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-gray-100 border shadow-sm"></div>
                <div className="text-sm font-medium">Gray 100</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-gray-300 shadow-sm"></div>
                <div className="text-sm font-medium">Gray 300</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-gray-500 shadow-sm"></div>
                <div className="text-sm font-medium">Gray 500</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-gray-900 shadow-sm"></div>
                <div className="text-sm font-medium">Gray 900</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-gray-950 shadow-sm"></div>
                <div className="text-sm font-medium">Gray 950</div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">Typography</h3>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Heading 1</h1>
                  <p className="text-sm text-gray-500 font-mono mt-1">text-4xl font-bold tracking-tight</p>
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">Heading 2</h2>
                  <p className="text-sm text-gray-500 font-mono mt-1">text-3xl font-semibold tracking-tight</p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">text-2xl font-semibold tracking-tight</p>
                </div>
                <div>
                  <h4 className="text-xl font-medium tracking-tight">Heading 4</h4>
                  <p className="text-sm text-gray-500 font-mono mt-1">text-xl font-medium tracking-tight</p>
                </div>
                <div>
                  <p className="text-base leading-7">Paragraph: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.</p>
                  <p className="text-sm text-gray-500 font-mono mt-1">text-base leading-7</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Small Text: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                  <p className="text-sm text-gray-400 font-mono mt-1">text-sm text-gray-500</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Components Section */}
        <section className="space-y-8">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">Components</h2>
            <p className="text-gray-500 text-sm mt-1">Reusable UI components built with accessibility in mind.</p>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Button</h3>
            <Card>
              <CardContent className="p-6 space-y-8">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Variants</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button variant="danger">Danger</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Sizes</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">🔍</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">States</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button disabled>Disabled Primary</Button>
                    <Button variant="outline" disabled>Disabled Outline</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Badges */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Badge</h3>
            <Card>
              <CardContent className="p-6 flex flex-wrap gap-4">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Forms */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Forms (Input & Label)</h3>
            <Card>
              <CardContent className="p-6 space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="email-input">Email address</Label>
                  <Input id="email-input" type="email" placeholder="name@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disabled-input">Disabled Input</Label>
                  <Input id="disabled-input" type="text" placeholder="Cannot type here" disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-input">Password</Label>
                  <Input id="password-input" type="password" defaultValue="secret123" />
                  <p className="text-xs text-gray-500">Must be at least 8 characters long.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Card</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Example Card</CardTitle>
                  <CardDescription>This is a description for the card content.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Main content area of the card goes here. It can contain text, images, or other components.</p>
                </CardContent>
                <CardFooter className="justify-end space-x-2">
                  <Button variant="outline" size="sm">Cancel</Button>
                  <Button size="sm">Save changes</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Enter your credentials to access your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="m@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Sign In</Button>
                </CardFooter>
              </Card>
            </div>
          </div>

        </section>
      </div>
    </div>
  )
}
